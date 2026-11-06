import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import "./member.css";

function MemberWrite() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("여자");
  const [birth, setBirth] = useState("");
  const [tel, setTel] = useState("");
  const EMAIL_DOMAINS = ["naver.com", "gmail.com", "daum.net", "hanmail.net", "nate.com", "kakao.com"];
  const [emailId, setEmailId] = useState("");
  const [emailDomain, setEmailDomain] = useState(EMAIL_DOMAINS[0]);
  const [customDomain, setCustomDomain] = useState("");
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const email = emailId ? `${emailId}@${useCustomDomain ? customDomain : emailDomain}` : "";
  const [isOwner, setIsOwner] = useState(false);
  const [idChecked, setIdChecked] = useState(false);
  const [idMsg, setIdMsg] = useState("");
  const idRef = useRef("");

  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  const navigate = useNavigate();

  const handleEmailIdChange = (e) => {
    setEmailId(e.target.value);
    setCodeSent(false);
    setEmailChecked(false);
  };

  const handleDomainChange = (e) => {
    const value = e.target.value;
    if (value === "custom") {
      setUseCustomDomain(true);
      setCustomDomain("");
    } else {
      setUseCustomDomain(false);
      setEmailDomain(value);
    }
    setCodeSent(false);
    setEmailChecked(false);
  };

  const handleCustomDomainChange = (e) => {
    setCustomDomain(e.target.value);
    setCodeSent(false);
    setEmailChecked(false);
  };

  const sendEmailCode = async () => {
    if (!emailId || (useCustomDomain ? !customDomain : !emailDomain)) {
      alert("이메일을 입력해 주세요.");
      return;
    }
    try {
      const res = await http.post("/member/sendAuthCode.do", { email });
      if (res.data.result === "ok") {
        setCodeSent(true);
        setEmailMsg("");
      } else if (res.data.result === "mail_error") {
        alert("메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const verifyEmailCode = async () => {
    if (!code) { alert("인증번호를 입력해 주세요."); return; }
    try {
      const res = await http.post("/member/verifyAuthCode.do", { code });
      if (res.data.result === "ok") {
        setEmailChecked(true);
        setEmailMsg("이메일이 인증되었습니다.");
      } else {
        alert("인증번호가 일치하지 않습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const checkIdLive = async (value) => {
    if (value.length === 0) {
      setIdMsg("아이디를 반드시 입력하셔야 합니다.");
      return;
    }
    if (value.length < 4) {
      setIdMsg("아이디를 4자 이상 입력해 주세요.");
      return;
    }
    try {
      const res = await http.get("/member/checkId.do", { params: { id: value } });
      if (idRef.current !== value) return;
      if (res.data.duplicate) {
        setIdMsg(`<${value}>는 이미 사용 중인 아이디입니다.`);
        setIdChecked(false);
      } else {
        setIdMsg(`<${value}>는 사용 가능한 아이디입니다.`);
        setIdChecked(true);
      }
    } catch (err) {
      console.error(err);
      if (idRef.current !== value) return;
      setIdMsg("중복 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setIdChecked(false);
    }
  };

  const handleIdChange = (e) => {
    const value = e.target.value;
    setId(value);
    idRef.current = value;
    setIdChecked(false);
    checkIdLive(value);
  };

  const handleBirthChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, ""); // 숫자만 남김
    if (value.length > 8) value = value.slice(0, 8); // YYYYMMDD 8자리까지만
    let formatted = value;
    if (value.length > 4) formatted = value.slice(0, 4) + "-" + value.slice(4);
    if (value.length > 6) formatted = formatted.slice(0, 7) + "-" + value.slice(6);
    setBirth(formatted);
  };

  const formatPhone = (value) => {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return digits.slice(0, 3) + "-" + digits.slice(3);
    if (digits.length <= 10) return digits.slice(0, 3) + "-" + digits.slice(3, digits.length - 4) + "-" + digits.slice(-4);
    return digits.slice(0, 3) + "-" + digits.slice(3, 7) + "-" + digits.slice(7);
  };

  const handleTelChange = (e) => {
    setTel(formatPhone(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pw !== pw2) {
      alert("비밀번호와 비밀번호 확인이 같지 않습니다.");
      return;
    }
    if (!idChecked) {
      alert("아이디 중복 확인을 해주세요.");
      return;
    }
    if (!emailChecked) {
      alert("이메일 인증을 완료해 주세요.");
      return;
    }

    const data = { id, pw, name, gender, birth, tel, email, gradeNo: isOwner ? 2 : 1 };

    try {
      const response = await http.post("/member/write.do", data);
      if (response.data.success) {
        alert("회원가입이 완료되었습니다. 로그인해 주세요.");
        navigate("/member/login");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="auth-form-wrap wide">
      <h3>회원가입</h3>
      <div className="auth-form-card">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="id" className="form-label">아이디</label>
            <input type="text" className="form-control" id="id" required maxLength={20}
              value={id} onChange={handleIdChange} />
            {idMsg && <div className={"small mt-1 " + (idChecked ? "msg-ok" : "msg-bad")}>{idMsg}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="pw" className="form-label">비밀번호</label>
            <input type="password" className="form-control" id="pw" required maxLength={20}
              value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div className="mb-3">
            <label htmlFor="pw2" className="form-label">비밀번호 확인</label>
            <input type="password" className="form-control" id="pw2" required maxLength={20}
              value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">이름</label>
            <input type="text" className="form-control" id="name" required maxLength={10}
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label d-block">성별</label>
            <div className="gender-toggle-group">
              {["여자", "남자", "선택안함"].map((g) => (
                <button type="button" key={g}
                  className={"gender-toggle-btn" + (gender === g ? " active" : "")}
                  onClick={() => setGender(g)}>{g}</button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="birth" className="form-label">생년월일</label>
            <input type="text" className="form-control" id="birth" required
              placeholder="YYYY-MM-DD" maxLength={10}
              value={birth} onChange={handleBirthChange} />
          </div>
          <div className="mb-3">
            <label htmlFor="tel" className="form-label">연락처 (선택)</label>
            <input type="tel" className="form-control" id="tel" placeholder="- 제외하고 입력해 주세요. ex) 01012345678"
              maxLength={13} value={tel} onChange={handleTelChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">이메일</label>
            <div className="email-input-group">
              <input type="text" className="form-control" placeholder="이메일 아이디" disabled={emailChecked}
                value={emailId} onChange={handleEmailIdChange} />
              <span className="email-at">@</span>
              {useCustomDomain ? (
                <input type="text" className="form-control" placeholder="도메인 직접 입력" disabled={emailChecked}
                  value={customDomain} onChange={handleCustomDomainChange} />
              ) : (
                <select className="form-select" disabled={emailChecked}
                  value={emailDomain} onChange={handleDomainChange}>
                  {EMAIL_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                  <option value="custom">직접 입력</option>
                </select>
              )}
            </div>

            <div className="d-flex gap-2 mt-2">
              <button type="button" className="btn-olive-outline" disabled={emailChecked} onClick={sendEmailCode}>
                {codeSent ? "재전송" : "인증번호 받기"}
              </button>
            </div>

            {codeSent && !emailChecked && (
              <div className="d-flex gap-2 mt-2">
                <input type="text" className="form-control" maxLength={6} placeholder="6자리 인증번호"
                  value={code} onChange={(e) => setCode(e.target.value)} />
                <button type="button" className="btn-olive-outline" onClick={verifyEmailCode}>확인</button>
              </div>
            )}
            {emailMsg && <div className="small mt-1 msg-ok">{emailMsg}</div>}
          </div>
          <div className="form-check mb-3">
            <input type="checkbox" className="form-check-input" id="isOwner"
              checked={isOwner} onChange={(e) => setIsOwner(e.target.checked)} />
            <label className="form-check-label" htmlFor="isOwner">
              매장을 운영하는 점주로 가입합니다.
            </label>
          </div>
          <button type="submit" className="auth-btn-primary mb-2">가입하기</button>
          <button type="button" className="auth-btn-secondary" onClick={() => navigate(-1)}>취소</button>
        </form>
      </div>
    </div>
  );
}

export default MemberWrite;