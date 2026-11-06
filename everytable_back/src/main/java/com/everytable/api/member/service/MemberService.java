package com.everytable.api.member.service;

import com.everytable.api.member.vo.SignInResultVO;
import com.everytable.api.member.vo.SignUpResultVO;
import com.everytable.api.member.vo.MemberAuthResult;
import com.everytable.api.member.vo.MemberVO;
import com.everytable.api.member.vo.SuspensionHistoryVO;
import com.everytable.api.util.page.PageObject;

import java.util.List;
import java.util.Map;

public interface MemberService {

    // 회원가입
    SignUpResultVO signUp(MemberVO vo);

    // 로그인 - 원본 MemberController "/member/login.do"와 동일하게 2단계로 분리했다.
    //  1) authenticate(): 아이디/비밀번호/계정상태만 검증. 상태가 "휴면"이면 컨트롤러가 이메일 인증으로 분기.
    //  2) issueToken(): 실제 로그인 확정(마지막 로그인 갱신 + JWT 발급). 정상 로그인 또는
    //     휴면 인증(dormantVerify.do) 성공 후 호출된다.
    MemberAuthResult authenticate(String id, String pw);
    SignInResultVO issueToken(String id);
    void updateLastLogin(String id);

    // 조회
    MemberVO view(String id);                 // 내 정보 보기
    MemberVO memberInfo(String id);            // 관리자 - 회원 상세
    List<SuspensionHistoryVO> suspensionList(String userId);
    Map<String, Object> list(PageObject pageObject, String keyword, String status,
                              Integer gradeNo, String dateFrom, String dateTo); // 관리자 - 목록(검색/페이징)

    // 중복 체크
    boolean checkId(String id);
    boolean checkTel(String tel);
    boolean checkEmail(String email);

    // 아이디 찾기 / 비밀번호 찾기용 회원 확인 (이메일 인증번호 발송/검증 자체는
    // MemberRestController가 HttpSession + MailService로 원본과 동일하게 처리한다)
    String searchId(String name, String email);
    boolean verifyMemberForReset(String id, String email); // checkMemberInfo.do 대응
    int resetPasswordByEmailVerification(String id, String newPw); // 인증 완료 후 비밀번호 재설정 (구 비밀번호 확인 없음)

    // 내 정보 수정
    int changePw(String id, String currentPw, String newPw);
    int changeTel(String id, String tel);
    int changeEmail(String id, String email);
    int withdraw(String id, String pw);
    int reactivate(String id); // 휴면 -> 정상 (dormantVerify.do 인증 성공 후 호출)

    // 관리자 기능
    int changeStatus(String id, String status, Integer suspendDays, String reason, String adminId);
    int changeGrade(String id, Integer gradeNo);
    int adminResetPw(String id, String newPw);
}
