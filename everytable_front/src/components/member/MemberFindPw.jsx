import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import http from "../../api/http";
import "./member.css";

/**
 * 비밀번호 찾기 - 원본 MemberController의 3단계 흐름을 그대로 이식.
 *   1) id + email 일치 확인 (sendAuthCode.do, id 포함) -> 세션에 resetId 저장
 *   2) 이메일로 인증번호 발송 (sendAuthCode.do, id 없이 email만) -> MailService가 실제 발송
 *   3) 인증번호 확인 (verifyAuthCode.do) -> 세션에 authStatus=true 저장
 *   4) 새 비밀번호 등록 (resetPw.do) - 세션의 resetId/authStatus를 서버가 확인한다
 */
function MemberFindPw() {
  const [step, setStep] = useState(1); // 1: id/email, 2: 인증번호, 3: 새 비밀번호, 4: 완료
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleVerifyMember = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const check = await http.post("/member/sendAuthCode.do", { id, email });
      if (check.data.result === "no") {
        setError("입력하신 정보와 일치하는 회원이 없습니다.");
        return;
      }
      // 일치 확인되면 이어서 인증번호 발송 (id 없이 email만 전달)
      const send = await http.post("/member/sendAuthCode.do", { email });
      if (send.data.result === "ok") {
        setStep(2);
      } else if (send.data.result === "mail_error") {
        setError("인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요. (관리자에게 SMTP 설정 확인 요청)");
      } else {
        setError("인증번호 발송에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "요청 처리 중 오류가 발생했습니다.");
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await http.post("/member/verifyAuthCode.do", { code });
      if (res.data.result === "ok") {
        setStep(3);
      } else {
        setError("인증번호가 일치하지 않습니다.");
      }
    } catch (err) {
      console.error(err);
      setError("인증 처리 중 오류가 발생했습니다.");
    }
  };

  const handleResetPw = async (e) => {
    e.preventDefault();
    setError("");
    if (newPw !== newPw2) {
      setError("비밀번호와 비밀번호 확인이 같지 않습니다.");
      return;
    }
    try {
      const res = await http.post("/member/resetPw.do", { newPw });
      if (res.data.result === "ok") {
        setStep(4);
      } else {
        setError("비밀번호 재설정에 실패했습니다. 처음부터 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error(err);
      setError("비밀번호 재설정 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="auth-form-wrap">
      <h3>비밀번호 찾기</h3>
      <div className="auth-form-card">
        {error && <div className="auth-alert-danger">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleVerifyMember}>
            <div className="mb-3">
              <label className="form-label">아이디</label>
              <input type="text" className="form-control" required value={id} onChange={(e) => setId(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">이메일 (가입 시 등록한 이메일)</label>
              <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="auth-btn-primary">인증번호 받기</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <p className="text-muted small mb-3">{email} 로 발송된 6자리 인증번호를 입력해 주세요.</p>
            <div className="mb-3">
              <input type="text" className="form-control" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <button type="submit" className="auth-btn-primary">확인</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPw}>
            <div className="mb-3">
              <label className="form-label">새 비밀번호</label>
              <input type="password" className="form-control" required maxLength={20} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">새 비밀번호 확인</label>
              <input type="password" className="form-control" required maxLength={20} value={newPw2} onChange={(e) => setNewPw2(e.target.value)} />
            </div>
            <button type="submit" className="auth-btn-primary">비밀번호 변경</button>
          </form>
        )}

        {step === 4 && (
          <div>
            <div className="auth-alert-success">비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.</div>
            <button className="auth-btn-primary" onClick={() => navigate("/member/login")}>로그인하러 가기</button>
          </div>
        )}

        {step < 4 && (
          <div className="auth-links mt-3">
            <Link to="/member/login">로그인으로 돌아가기</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberFindPw;
