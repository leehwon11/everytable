import { useState } from "react";
import { Link } from "react-router-dom";
import http from "../../api/http";
import "./member.css";

// 원본 searchIdForm.jsp 이식. 원본은 이름+이메일이 일치해도 바로 아이디를 보여주지 않고,
// 찾은 계정의 비밀번호까지 한 번 더 확인해야 아이디를 공개하는 2단계 구조였다.
// (이전 버전은 이름+이메일만으로 바로 아이디를 노출해서 원본보다 보안이 약했던 걸 되돌림)
function MemberFindId() {
  const [step, setStep] = useState(1); // 1: 이름/이메일, 2: 비밀번호 확인, 3: 결과
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [foundId, setFoundId] = useState("");
  const [pw, setPw] = useState("");
  const [notFound, setNotFound] = useState(false);

  const handleStep1 = async (e) => {
    e.preventDefault();
    setNotFound(false);
    try {
      const res = await http.get("/member/searchId.do", { params: { name, email } });
      if (res.data.found) {
        setFoundId(res.data.id);
        setStep(2);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error(err);
      alert("조회 중 오류가 발생했습니다.");
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    try {
      const res = await http.post("/member/checkPwForId.do", { id: foundId, pw });
      if (res.data.result === "match") {
        setStep(3);
      } else {
        alert("비밀번호가 일치하지 않습니다.");
        setPw("");
      }
    } catch (err) {
      console.error(err);
      alert("확인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="auth-form-wrap">
      <h3>아이디 찾기</h3>
      <div className="auth-form-card">
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <div className="mb-3">
              <label className="form-label">이름</label>
              <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">이메일</label>
              <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {notFound && <div className="auth-alert-danger py-2">일치하는 정보가 없습니다.</div>}
            <button type="submit" className="auth-btn-primary">다음</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2}>
            <p className="text-muted small mb-3">본인 확인을 위해 계정 비밀번호를 입력해 주세요.</p>
            <div className="mb-3">
              <input type="password" className="form-control" required autoFocus
                placeholder="비밀번호" value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
            <button type="submit" className="auth-btn-primary">확인</button>
          </form>
        )}

        {step === 3 && (
          <div className="auth-alert-info">
            회원님의 아이디는 <b>{foundId}</b> 입니다.
          </div>
        )}

        <div className="auth-links mt-3" style={{ justifyContent: "flex-start" }}>
          <Link to="/member/login">로그인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}

export default MemberFindId;
