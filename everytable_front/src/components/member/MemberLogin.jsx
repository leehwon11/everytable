import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import http from "../../api/http";
import "./member.css";

function saveLoginAndRedirect(token) {
  const decoded = jwtDecode(token); // { sub, no, name, gradeNo, roles, iat, exp }
  const login = {
    id: decoded.sub,
    no: decoded.no,
    name: decoded.name,
    gradeNo: decoded.gradeNo,
    roles: decoded.roles,
  };
  localStorage.setItem("token", token);
  localStorage.setItem("login", JSON.stringify(login));
  window.dispatchEvent(new Event("auth-change"));
  alert(`${login.name}님, 환영합니다.`);
  location.href = "/";
}

function MemberLogin() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  // 휴면 계정 인증 단계 (원본 member/dormantAuthForm.jsp 대응)
  const [dormant, setDormant] = useState(false);
  const [dormantMsg, setDormantMsg] = useState("");
  const [code, setCode] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    document.getElementById("id")?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // 원본 everytable.member.controller.MemberController "/member/login.do" 이식
      const response = await http.post("/member/login.do", { id, pw });
      const result = response.data;

      if (result.status === "dormant") {
        // 휴면 계정: 이메일로 인증번호가 발송됨. 인증 단계로 전환한다.
        setDormant(true);
        setDormantMsg(result.message);
        return;
      }

      if (result.success && result.token) {
        saveLoginAndRedirect(result.token);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "아이디 또는 비밀번호가 일치하지 않습니다.");
    }
  };

  const verifyDormant = async (e) => {
    e.preventDefault();
    try {
      const res = await http.post("/member/dormantVerify.do", { code });
      if (res.data.result === "ok") {
        saveLoginAndRedirect(res.data.token);
      } else {
        alert("인증번호가 일치하지 않습니다. 다시 확인해 주세요.");
        setCode("");
      }
    } catch (err) {
      console.error(err);
      alert("인증 처리 중 오류가 발생했습니다.");
    }
  };

  if (dormant) {
    return (
      <div className="auth-form-wrap">
        <h3>휴면 계정 인증</h3>
        <div className="auth-form-card">
          <div className="auth-alert-warning">{dormantMsg}</div>
          <form onSubmit={verifyDormant}>
            <div className="mb-3">
              <label htmlFor="code" className="form-label">인증번호 (6자리)</label>
              <input type="text" className="form-control" id="code" maxLength={6} required
                value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <button type="submit" className="auth-btn-primary">확인</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-wrap">
      <h3>로그인</h3>
      <div className="auth-form-card">
        {error && <div className="auth-alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="id" className="form-label">아이디</label>
            <input type="text" className="form-control" id="id" required maxLength={20}
              value={id} onChange={(e) => setId(e.target.value)} />
          </div>
          <div className="mb-3">
            <label htmlFor="pw" className="form-label">비밀번호</label>
            <input type="password" className="form-control" id="pw" required maxLength={20}
              value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <button type="submit" className="auth-btn-primary mb-2">로그인</button>
          <button type="button" className="auth-btn-secondary mb-3" onClick={() => navigate("/")}>취소</button>
          <div className="auth-links">
            <Link to="/member/find-id">아이디 찾기</Link>
            <Link to="/member/find-pw">비밀번호 찾기</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MemberLogin;
