package com.everytable.api.member.service;

import com.everytable.api.common.CommonResponse;
import com.everytable.api.config.security.JwtTokenProvider;
import com.everytable.api.member.schedule.MemberScheduledTasks;
import com.everytable.api.member.vo.SignInResultVO;
import com.everytable.api.member.vo.SignUpResultVO;
import com.everytable.api.member.entity.Member;
import com.everytable.api.member.entity.SuspensionHistory;
import com.everytable.api.member.repository.MemberRepository;
import com.everytable.api.member.repository.MemberRepositoryCustom;
import com.everytable.api.member.repository.SuspensionHistoryRepository;
import com.everytable.api.member.vo.MemberAuthResult;
import com.everytable.api.member.vo.MemberVO;
import com.everytable.api.member.vo.SuspensionHistoryVO;
import com.everytable.api.util.page.PageObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 원본 everytable.member.dao.MemberDAO + member.service.* (Login/Write/View/List/ChangeStatus 등
 * 20여개의 개별 Service 클래스) 를 하나의 MemberServiceImpl로 통합 이식.
 *
 * 휴면 계정 재활성화 / 비밀번호 찾기의 이메일 인증번호(OTP) 발송 로직은 원본과 동일하게 유지했다.
 * 실제 메일 발송은 MailService(JavaMailSenderMailService)가 담당하며, 인증번호 생성/세션 저장/검증
 * 흐름은 MemberRestController가 원본 MemberController와 동일한 방식(HttpSession)으로 처리한다.
 * (SMTP 계정 정보를 채우지 않으면 메일 발송 시점에 예외가 발생한다 - application.properties 참고)
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class MemberServiceImpl implements MemberService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final MemberRepository memberRepository;
    private final MemberRepositoryCustom memberRepositoryCustom;
    private final SuspensionHistoryRepository suspensionHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final MemberScheduledTasks memberScheduledTasks;

    // ----------------------------------------------------------------
    // 회원가입
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public SignUpResultVO signUp(MemberVO vo) {
        if (memberRepository.existsByLoginId(vo.getId())) {
            throw new RuntimeException("이미 사용 중인 아이디입니다.");
        }

        int gradeNo = (vo.getGradeNo() != null && vo.getGradeNo() == 2) ? 2 : 1;

        Member member = Member.builder()
                .loginId(vo.getId())
                .pw(passwordEncoder.encode(vo.getPw()))
                .name(vo.getName())
                .gender(vo.getGender())
                .birth(LocalDate.parse(vo.getBirth()))
                .tel(vo.getTel())
                .email(vo.getEmail())
                .status("정상")
                .gradeNo(gradeNo)
                .build();

        memberRepository.save(member);

        SignUpResultVO result = new SignUpResultVO();
        result.setSuccess(true);
        result.setCode(CommonResponse.SUCCESS.getCode());
        result.setMsg(CommonResponse.SUCCESS.getMsg());
        return result;
    }

    // ----------------------------------------------------------------
    // 로그인 - 1단계: 아이디/비밀번호/계정상태 검증만 수행 (원본 login.do 앞부분과 동일)
    // ----------------------------------------------------------------
    @Override
    public MemberAuthResult authenticate(String id, String pw) {
        memberScheduledTasks.releaseSuspendedMembers();
        memberScheduledTasks.setDormantMembers();

        Member member = memberRepository.findByLoginId(id)
                .orElseThrow(() -> new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(pw, member.getPw())) {
            throw new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        switch (member.getStatus()) {
            case "정지" -> throw new RuntimeException("정지된 계정입니다. (해제일: " + member.getSuspensionEndDate() + ")");
            case "탈퇴" -> throw new RuntimeException("탈퇴한 계정입니다.");
            case "파기" -> throw new RuntimeException("더 이상 사용할 수 없는 계정입니다.");
            default -> { /* 정상 또는 휴면 -> 컨트롤러가 분기 처리 */ }
        }

        return new MemberAuthResult(member.getLoginId(), member.getName(), member.getGradeNo(),
                member.getGradeName(), member.getStatus(), member.getEmail());
    }

    // ----------------------------------------------------------------
    // 로그인 - 2단계: 로그인 확정 (마지막 로그인 갱신 + JWT 발급)
    // 정상 로그인 직후, 또는 휴면 계정 이메일 인증(dormantVerify.do) 성공 직후에 호출된다.
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public SignInResultVO issueToken(String id) {
        Member member = memberRepository.findByLoginId(id)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 회원입니다."));

        member.setLastLogin(LocalDateTime.now());
        memberRepository.save(member);

        String token = jwtTokenProvider.createToken(member.getNo(), member.getLoginId(), member.getName(), member.getGradeNo(), member.getRoles());

        return SignInResultVO.builder()
                .success(true)
                .code(CommonResponse.SUCCESS.getCode())
                .msg(CommonResponse.SUCCESS.getMsg())
                .token(token)
                .id(member.getLoginId())
                .name(member.getName())
                .gradeNo(member.getGradeNo())
                .gradeName(member.getGradeName())
                .build();
    }

    @Override
    @Transactional
    public void updateLastLogin(String id) {
        memberRepository.findByLoginId(id).ifPresent(m -> {
            m.setLastLogin(LocalDateTime.now());
            memberRepository.save(m);
        });
    }

    // ----------------------------------------------------------------
    // 조회
    // ----------------------------------------------------------------
    @Override
    public MemberVO view(String id) {
        Member member = memberRepository.findByLoginId(id)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 회원입니다."));
        return toVO(member, false);
    }

    @Override
    public MemberVO memberInfo(String id) {
        Member member = memberRepository.findByLoginId(id)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 회원입니다."));
        return toVO(member, true);
    }

    @Override
    public List<SuspensionHistoryVO> suspensionList(String userId) {
        Member target = memberRepository.findByLoginId(userId).orElse(null);
        if (target == null) return new ArrayList<>();

        List<SuspensionHistoryVO> list = new ArrayList<>();
        for (SuspensionHistory h : suspensionHistoryRepository.findByUserNoOrderBySusNoDesc(target.getNo())) {
            SuspensionHistoryVO vo = new SuspensionHistoryVO();
            vo.setSusNo(h.getSusNo());
            vo.setUserNo(target.getNo());
            vo.setStartDate(h.getStartDate() == null ? null : h.getStartDate().toLocalDate().format(DATE_FMT));
            vo.setEndDate(h.getEndDate() == null ? null : h.getEndDate().format(DATE_FMT));
            vo.setReason(h.getReason());
            // adminNo -> 화면에 보여줄 관리자 이름으로 변환 (로그인 아이디는 노출하지 않는다)
            vo.setAdminNo(h.getAdminNo());
            if (h.getAdminNo() != null) {
                memberRepository.findById(h.getAdminNo()).ifPresent(admin -> vo.setAdminName(admin.getName()));
            }
            list.add(vo);
        }
        return list;
    }

    @Override
    public Map<String, Object> list(PageObject pageObject, String keyword, String status,
                                     Integer gradeNo, String dateFrom, String dateTo) {
        long total = memberRepositoryCustom.searchCount(keyword, status, gradeNo, dateFrom, dateTo);
        pageObject.setTotalRow(total);

        List<Member> members = memberRepositoryCustom.search(
                keyword, status, gradeNo, dateFrom, dateTo,
                pageObject.getLimit(), pageObject.getPerPageNum());

        List<MemberVO> list = new ArrayList<>();
        for (Member m : members) list.add(toVO(m, false));

        Map<String, Object> result = new HashMap<>();
        result.put("list", list);
        result.put("pageObject", pageObject);
        return result;
    }

    // ----------------------------------------------------------------
    // 중복 체크
    // ----------------------------------------------------------------
    @Override
    public boolean checkId(String id) {
        return memberRepository.existsByLoginId(id);
    }

    @Override
    public boolean checkTel(String tel) {
        return memberRepository.existsByTelAndStatusNot(tel, "탈퇴");
    }

    @Override
    public boolean checkEmail(String email) {
        return memberRepository.existsByEmailAndStatusNot(email, "탈퇴");
    }

    // ----------------------------------------------------------------
    // 아이디 찾기 / 비밀번호 찾기용 회원 확인
    // ----------------------------------------------------------------
    @Override
    public String searchId(String name, String email) {
        return memberRepository.findByNameAndEmailAndStatus(name, email, "정상")
                .map(Member::getLoginId)
                .orElse(null);
    }

    @Override
    public boolean verifyMemberForReset(String id, String email) {
        return memberRepository.findByLoginIdAndEmail(id, email).isPresent();
    }

    // 이메일 인증(sendAuthCode.do + verifyAuthCode.do)까지 끝난 뒤 컨트롤러가 호출한다.
    // 원본 DAO.changePw(vo, user=0)과 동일하게 기존 비밀번호 확인 없이 바로 변경한다.
    @Override
    @Transactional
    public int resetPasswordByEmailVerification(String id, String newPw) {
        Member member = memberRepository.findByLoginId(id).orElse(null);
        if (member == null) return 0;
        member.setPw(passwordEncoder.encode(newPw));
        memberRepository.save(member);
        return 1;
    }

    // ----------------------------------------------------------------
    // 내 정보 수정
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public int changePw(String id, String currentPw, String newPw) {
        Member member = memberRepository.findByLoginId(id).orElse(null);
        if (member == null) return 0;
        if (!passwordEncoder.matches(currentPw, member.getPw())) return 0;
        member.setPw(passwordEncoder.encode(newPw));
        memberRepository.save(member);
        return 1;
    }

    @Override
    @Transactional
    public int changeTel(String id, String tel) {
        Member member = memberRepository.findByLoginId(id).orElse(null);
        if (member == null) return 0;
        member.setTel((tel == null || tel.trim().isEmpty()) ? null : tel.trim());
        memberRepository.save(member);
        return 1;
    }

    @Override
    @Transactional
    public int changeEmail(String id, String email) {
        Member member = memberRepository.findByLoginId(id).orElse(null);
        if (member == null) return 0;
        member.setEmail(email);
        memberRepository.save(member);
        return 1;
    }

    @Override
    @Transactional
    public int withdraw(String id, String pw) {
        Member member = memberRepository.findByLoginId(id).orElse(null);
        if (member == null) return 0;
        if (!passwordEncoder.matches(pw, member.getPw())) return 0;
        if (member.getGradeNo() != null && member.getGradeNo() == 9) {
            throw new RuntimeException("관리자 계정은 이 화면에서 탈퇴할 수 없습니다.");
        }
        member.setStatus("탈퇴");
        member.setWithdrawDate(LocalDate.now());
        memberRepository.save(member);
        return 1;
    }

    @Override
    @Transactional
    public int reactivate(String id) {
        Member member = memberRepository.findByLoginId(id).orElse(null);
        if (member == null) return 0;
        member.setStatus("정상");
        memberRepository.save(member);
        return 1;
    }

    // ----------------------------------------------------------------
    // 관리자 기능
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public int changeStatus(String id, String status, Integer suspendDays, String reason, String adminId) {
        Member member = memberRepository.findByLoginId(id).orElse(null);
        if (member == null) return 0;

        if ("정지".equals(status)) {
            if (suspendDays == null || suspendDays <= 0) return 0;
            LocalDate endDate = LocalDate.now().plusDays(suspendDays);
            member.setStatus("정지");
            member.setSuspensionEndDate(endDate);
            memberRepository.save(member);

            // suspension_history.user_no/admin_no는 이제 member_no(Long)를 참조하는 FK라
            // 로그인 아이디(String) 대신 실제 회원번호를 조회해서 넣어야 한다.
            Long adminNo = memberRepository.findByLoginId(adminId).map(Member::getNo).orElse(null);
            SuspensionHistory history = SuspensionHistory.builder()
                    .userNo(member.getNo())
                    .startDate(LocalDateTime.now())
                    .endDate(endDate)
                    .reason(reason == null ? "" : reason)
                    .adminNo(adminNo)
                    .build();
            suspensionHistoryRepository.save(history);
            return 1;
        }

        // '파기' 상태는 DB 스케줄러(배치)로만 자동 처리하도록 원본과 동일하게 관리자 직접 변경은 막는다.
        if ("파기".equals(status)) {
            throw new RuntimeException("파기 상태는 관리자가 직접 변경할 수 없습니다.");
        }

        member.setStatus(status);
        member.setSuspensionEndDate(null);
        member.setWithdrawDate("탈퇴".equals(status) ? LocalDate.now() : null);
        memberRepository.save(member);
        return 1;
    }

    @Override
    @Transactional
    public int changeGrade(String id, Integer gradeNo) {
        Member member = memberRepository.findByLoginId(id).orElse(null);
        if (member == null) return 0;
        member.setGradeNo(gradeNo);
        memberRepository.save(member);
        return 1;
    }

    @Override
    @Transactional
    public int adminResetPw(String id, String newPw) {
        Member member = memberRepository.findByLoginId(id).orElse(null);
        if (member == null) return 0;
        if ("파기".equals(member.getStatus())) {
            throw new RuntimeException("파기된 회원의 비밀번호는 초기화할 수 없습니다.");
        }
        member.setPw(passwordEncoder.encode(newPw));
        memberRepository.save(member);
        return 1;
    }

    // ----------------------------------------------------------------
    // Member -> MemberVO 변환
    // ----------------------------------------------------------------
    private MemberVO toVO(Member m, boolean includeAdminFields) {
        MemberVO vo = new MemberVO();
        vo.setNo(m.getNo());
        vo.setId(m.getLoginId());
        vo.setName(m.getName());
        vo.setGender(m.getGender());
        vo.setBirth(m.getBirth() == null ? null : m.getBirth().format(DATE_FMT));
        vo.setTel(m.getTel());
        vo.setEmail(m.getEmail());
        vo.setStatus(m.getStatus());
        vo.setGradeNo(m.getGradeNo());
        vo.setGradeName(m.getGradeName());
        vo.setJoinDate(m.getJoinDate() == null ? null : m.getJoinDate().toLocalDate().format(DATE_FMT));
        vo.setLastLogin(m.getLastLogin() == null ? null : m.getLastLogin().toLocalDate().format(DATE_FMT));
        if (includeAdminFields) {
            vo.setSuspensionEndDate(m.getSuspensionEndDate() == null ? null : m.getSuspensionEndDate().format(DATE_FMT));
            vo.setWithdrawDate(m.getWithdrawDate() == null ? null : m.getWithdrawDate().format(DATE_FMT));
        }
        return vo;
    }
}
