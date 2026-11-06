package com.everytable.api.member.controller;

import com.everytable.api.mail.MailService;
import com.everytable.api.member.vo.SignInResultVO;
import com.everytable.api.member.vo.SignUpResultVO;
import com.everytable.api.member.security.MemberUserDetails;
import com.everytable.api.member.service.MemberService;
import com.everytable.api.member.vo.LoginVO;
import com.everytable.api.member.vo.MemberAuthResult;
import com.everytable.api.member.vo.MemberVO;
import com.everytable.api.util.page.PageObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

/**
 * 원본 everytable.member.controller.MemberController (700줄, 30여개 case 분기) 를
 * Spring MVC REST 컨트롤러로 이식. URI(.do)는 최대한 원본과 동일하게 유지해서
 * webjjang_front 참고 프로젝트의 axios 호출 패턴과도 맞췄다.
 *
 * 휴면 계정 인증(dormantVerify.do), 이메일 인증번호 발송/검증(sendAuthCode.do/verifyAuthCode.do),
 * 인증 완료 후 비밀번호 재설정(resetPw.do)은 원본과 동일하게 HttpSession에
 * authCode/dormantId/resetId/authStatus를 저장해 두는 방식을 그대로 이식했다.
 * 실제 메일 발송만 MailService(JavaMailSenderMailService)가 담당하며, SMTP 계정을
 * application.properties에 설정하지 않으면 발송 시점에 예외가 발생한다(README 참고).
 *
 * 세션 쿠키가 React(5173)와 오가야 하므로 CORS는 allowCredentials(true)가 필수인데, 이 설정을
 * 컨트롤러마다 개별 @CrossOrigin으로 흩어놓았다가 이 컨트롤러만 allowCredentials를 켜놓고 나머지
 * 9개 컨트롤러는 빠뜨렸던 적이 있다 - 그러면 http.js가 모든 요청에 걸어둔 withCredentials:true 때문에
 * 그 9개 컨트롤러로 가는 요청이 전부 브라우저 CORS 정책에 막혀버린다. 지금은 SecurityConfiguration의
 * corsConfigurationSource() 빈 하나로 전체 컨트롤러에 동일하게 적용되므로 여기 별도 애노테이션은 없다.
 */
@RestController
@RequestMapping("/member")
@RequiredArgsConstructor
@Log4j2
public class MemberRestController {

    private final MemberService memberService;
    private final MailService mailService;
    private final SecureRandom random = new SecureRandom();

    private String currentLoginId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof MemberUserDetails details)) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return details.getUsername();
    }

    private String generateAuthCode() {
        return String.valueOf(100000 + random.nextInt(900000));
    }

    // ------------------------------------------------------------
    // 회원가입
    // ------------------------------------------------------------
    @PostMapping("/write.do")
    public SignUpResultVO write(@RequestBody MemberVO vo) {
        log.info("[write] 회원가입 요청 id = {}", vo.getId());
        return memberService.signUp(vo);
    }

    // ------------------------------------------------------------
    // 로그인 (원본 "/member/login.do" case 전체 이식)
    // ------------------------------------------------------------
    @PostMapping("/login.do")
    public Object login(@RequestBody LoginVO vo, HttpServletRequest request) {
        log.info("[login] 로그인 시도 id = {}", vo.getId());
        MemberAuthResult auth = memberService.authenticate(vo.getId(), vo.getPw());

        if ("휴면".equals(auth.getStatus())) {
            // 원본: 인증번호 생성 + 세션 저장 + 메일 발송 후 dormantAuthForm으로 이동
            String authCode = generateAuthCode();
            HttpSession session = request.getSession(true);
            session.setAttribute("authCode", authCode);
            session.setAttribute("dormantId", auth.getId());

            try {
                mailService.sendMail(auth.getEmail(), "에브리테이블(everytable) 휴면 계정 인증번호입니다.",
                        "안녕하세요.<br><br>" +
                        "휴면 상태의 계정입니다. 인증 후 정상 계정으로 전환됩니다.<br><br>" +
                        "인증번호: <b>" + authCode + "</b><br><br>" +
                        "해당 인증번호를 입력하여 인증을 완료해 주세요.<br><br>감사합니다.");
            } catch (Exception e) {
                log.error("[login] 휴면 인증 메일 발송 실패", e);
                throw new RuntimeException("인증 메일 발송에 실패했습니다: " + e.getMessage());
            }

            Map<String, Object> result = new HashMap<>();
            result.put("status", "dormant");
            result.put("message", "휴면 계정입니다. 가입하신 이메일로 발송된 인증번호를 입력해 주세요.");
            return result;
        }

        return memberService.issueToken(auth.getId());
    }

    // 휴면 계정 인증번호 확인 - 성공하면 정상 전환 + 즉시 로그인(JWT 발급)까지 원본과 동일하게 처리
    @PostMapping("/dormantVerify.do")
    public Map<String, Object> dormantVerify(@RequestBody Map<String, String> body, HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        String inputCode = body.get("code");
        String savedCode = session == null ? null : (String) session.getAttribute("authCode");
        String dormantId = session == null ? null : (String) session.getAttribute("dormantId");

        if (savedCode == null || dormantId == null || !savedCode.equals(inputCode)) {
            return Map.of("result", "fail");
        }

        memberService.reactivate(dormantId);
        SignInResultVO tokenResult = memberService.issueToken(dormantId);

        session.removeAttribute("authCode");
        session.removeAttribute("dormantId");

        Map<String, Object> result = new HashMap<>();
        result.put("result", "ok");
        result.put("token", tokenResult.getToken());
        result.put("id", tokenResult.getId());
        result.put("name", tokenResult.getName());
        result.put("gradeNo", tokenResult.getGradeNo());
        result.put("gradeName", tokenResult.getGradeName());
        return result;
    }

    // ------------------------------------------------------------
    // 중복 체크 / 아이디 찾기
    // ------------------------------------------------------------
    @GetMapping("/checkId.do")
    public Map<String, Object> checkId(String id) {
        return Map.of("duplicate", memberService.checkId(id));
    }

    @GetMapping("/checkTel.do")
    public Map<String, Object> checkTel(String tel) {
        return Map.of("duplicate", memberService.checkTel(tel));
    }

    @GetMapping("/checkEmail.do")
    public Map<String, Object> checkEmail(String email) {
        return Map.of("duplicate", memberService.checkEmail(email));
    }

    @GetMapping("/searchId.do")
    public Map<String, Object> searchId(String name, String email) {
        String id = memberService.searchId(name, email);
        Map<String, Object> result = new HashMap<>();
        result.put("id", id);
        result.put("found", id != null);
        return result;
    }

    // 원본 checkPwForId.do 대응. 아이디 찾기 2단계 - searchId.do로 찾은 아이디의 비밀번호를
    // 입력받아 login 서비스(authenticate)를 재사용해 맞는지 확인한 뒤에만 아이디를 화면에 보여준다.
    // (이 확인 없이 이름+이메일만으로 바로 아이디를 노출하면 원본보다 보안이 약해진다.)
    @PostMapping("/checkPwForId.do")
    public Map<String, Object> checkPwForId(@RequestBody Map<String, String> body) {
        try {
            memberService.authenticate(body.get("id"), body.get("pw"));
            return Map.of("result", "match");
        } catch (RuntimeException e) {
            return Map.of("result", "mismatch");
        }
    }

    // ------------------------------------------------------------
    // 이메일 인증번호 발송/검증 (원본 sendAuthCode.do/verifyAuthCode.do 그대로 이식)
    //
    // 원본과 동일하게 두 가지 용도로 쓰인다:
    //  1) 회원가입 이메일 인증: id 파라메터 없이 email만 보내면 바로 인증번호 발송
    //  2) 비밀번호 찾기: 먼저 id+email로 회원 일치 여부를 확인해서 세션에 resetId를 저장하고,
    //     그 다음 email만 다시 보내 인증번호를 발송하는 2번의 호출로 이루어진다.
    // ------------------------------------------------------------
    @PostMapping("/sendAuthCode.do")
    public Map<String, Object> sendAuthCode(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String id = body.get("id");
        String email = body.get("email");
        HttpSession session = request.getSession(true);

        if (id != null && !id.trim().isEmpty()) {
            boolean ok = memberService.verifyMemberForReset(id, email);
            session.setAttribute("resetId", ok ? id : null);
            return Map.of("result", ok ? id : "no");
        }

        String authCode = generateAuthCode();
        session.setAttribute("authCode", authCode);
        try {
            mailService.sendMail(email, "에브리테이블(everytable) 이메일 인증번호입니다.",
                    "안녕하세요.<br><br>인증번호: <b>" + authCode + "</b><br><br>" +
                    "해당 인증번호를 입력하여 인증을 완료해 주세요.<br><br>감사합니다.");
        } catch (Exception e) {
            log.error("[sendAuthCode] 메일 발송 실패", e);
            return Map.of("result", "mail_error", "message", e.getMessage());
        }
        return Map.of("result", "ok");
    }

    @PostMapping("/verifyAuthCode.do")
    public Map<String, Object> verifyAuthCode(@RequestBody Map<String, String> body, HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        String inputCode = body.get("code");
        String savedCode = session == null ? null : (String) session.getAttribute("authCode");

        if (savedCode != null && savedCode.equals(inputCode)) {
            session.setAttribute("authStatus", true);
            return Map.of("result", "ok");
        }
        return Map.of("result", "fail");
    }

    @PostMapping("/verifyMemberForReset.do")
    public Map<String, Object> verifyMemberForReset(@RequestBody Map<String, String> body) {
        boolean ok = memberService.verifyMemberForReset(body.get("id"), body.get("email"));
        return Map.of("result", ok ? "ok" : "fail");
    }

    // 비밀번호 재설정 3단계 - verifyAuthCode.do로 세션에 authStatus=true가 세팅되어 있어야 한다.
    @PostMapping("/resetPw.do")
    public Map<String, Object> resetPw(@RequestBody Map<String, String> body, HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Boolean authStatus = session == null ? null : (Boolean) session.getAttribute("authStatus");
        String resetId = session == null ? null : (String) session.getAttribute("resetId");

        if (authStatus == null || !authStatus || resetId == null) {
            return Map.of("result", "fail");
        }

        int result = memberService.resetPasswordByEmailVerification(resetId, body.get("newPw"));
        if (result == 1) {
            session.removeAttribute("authCode");
            session.removeAttribute("authStatus");
            session.removeAttribute("resetId");
            return Map.of("result", "ok");
        }
        return Map.of("result", "fail");
    }

    // ------------------------------------------------------------
    // 내 정보 (로그인 필요)
    // ------------------------------------------------------------
    @GetMapping("/view.do")
    public MemberVO view(Authentication authentication) {
        return memberService.view(currentLoginId(authentication));
    }

    @PostMapping("/changePw.do")
    public Map<String, Object> changePw(@RequestBody Map<String, String> body, Authentication authentication) {
        int result = memberService.changePw(currentLoginId(authentication), body.get("pw"), body.get("newPw"));
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/changeTel.do")
    public Map<String, Object> changeTel(@RequestBody Map<String, String> body, Authentication authentication) {
        String tel = body.get("tel");
        if (tel != null && !tel.isBlank() && memberService.checkTel(tel)) {
            return Map.of("result", "dup");
        }
        int result = memberService.changeTel(currentLoginId(authentication), tel);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/changeEmail.do")
    public Map<String, Object> changeEmail(@RequestBody Map<String, String> body, Authentication authentication) {
        String email = body.get("email");
        if (memberService.checkEmail(email)) {
            return Map.of("result", "dup");
        }
        int result = memberService.changeEmail(currentLoginId(authentication), email);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/withdraw.do")
    public Map<String, Object> withdraw(@RequestBody Map<String, String> body, Authentication authentication) {
        int result = memberService.withdraw(currentLoginId(authentication), body.get("pw"));
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    // ------------------------------------------------------------
    // 관리자 기능 (ROLE_ADMIN)
    // ------------------------------------------------------------
    @GetMapping("/list.do")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> list(HttpServletRequest request, String keyword, String status,
                                                      Integer gradeNo, String dateFrom, String dateTo) {
        PageObject pageObject = PageObject.getInstance(request);
        return ResponseEntity.status(HttpStatus.OK).body(memberService.list(pageObject, keyword, status, gradeNo, dateFrom, dateTo));
    }

    @GetMapping("/memberInfo.do")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> memberInfo(String id) {
        Map<String, Object> result = new HashMap<>();
        result.put("vo", memberService.memberInfo(id));
        result.put("suspensionList", memberService.suspensionList(id));
        return result;
    }

    @PostMapping("/changeStatus.do")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> changeStatus(@RequestBody Map<String, Object> body, Authentication authentication) {
        String id = (String) body.get("id");
        if (id.equals(currentLoginId(authentication))) {
            return Map.of("result", "fail", "message", "로그인한 관리자의 상태는 변경할 수 없습니다.");
        }
        String status = (String) body.get("status");
        Integer days = body.get("days") == null ? null : Integer.valueOf(body.get("days").toString());
        String reason = (String) body.get("reason");
        int result = memberService.changeStatus(id, status, days, reason, currentLoginId(authentication));
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/changeGrade.do")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> changeGrade(@RequestBody Map<String, Object> body, Authentication authentication) {
        String id = (String) body.get("id");
        if (id.equals(currentLoginId(authentication))) {
            return Map.of("result", "fail", "message", "로그인한 관리자의 등급은 변경할 수 없습니다.");
        }
        Integer gradeNo = Integer.valueOf(body.get("gradeNo").toString());
        int result = memberService.changeGrade(id, gradeNo);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/adminResetPw.do")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> adminResetPw(@RequestBody Map<String, String> body) {
        int result = memberService.adminResetPw(body.get("id"), body.get("newPw"));
        return Map.of("result", result == 1 ? "ok" : "fail");
    }
}
