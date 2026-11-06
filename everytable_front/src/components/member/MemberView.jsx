import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import "./member.css";

// 원본 member/view.jsp 이식. 원본은 "수정" 버튼을 누르면 인라인 폼이 토글되며
// 비밀번호/전화번호/이메일을 각각 변경할 수 있었는데(이메일은 인증번호 재확인 필요),
// 이전 버전은 읽기전용 표+탈퇴 버튼만 있고 이 수정 기능들이 통째로 빠져 있었다.
const TEL_PATTERN = /^0\d{1,2}-\d{3,4}-\d{4}$/;

function MemberView() {
  const [vo, setVo] = useState(null);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(null); // "pw" | "tel" | "email" | null
  const navigate = useNavigate();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPw, setWithdrawPw] = useState("");

  // 비밀번호 수정
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  // 전화번호 수정
  const [newTel, setNewTel] = useState("");

  // 이메일 수정 (인증번호 재확인 필요)
  const [newEmail, setNewEmail] = useState("");
  const [emailCodeArea, setEmailCodeArea] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  const load = () => {
    http.get("/member/view.do")
      .then((res) => setVo(res.data))
      .catch((err) => {
        console.error(err);
        setError("정보를 불러오지 못했습니다. 다시 로그인해 주세요.");
      });
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/member/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const resetEditState = () => {
    setCurPw(""); setNewPw(""); setNewPw2("");
    setNewTel("");
    setNewEmail(""); setEmailCodeArea(false); setEmailCode(""); setEmailVerified(false);
  };

  const toggleForm = (target) => {
    resetEditState();
    setOpenForm((prev) => (prev === target ? null : target));
  };

  const savePw = async () => {
    if (!curPw || !newPw || !newPw2) { alert("모든 항목을 입력해 주세요."); return; }
    if (newPw !== newPw2) { alert("새 비밀번호와 확인이 일치하지 않습니다."); return; }
    if (newPw.length < 4 || newPw.length > 20) { alert("비밀번호는 4~20자로 입력해 주세요."); return; }
    try {
      const res = await http.post("/member/changePw.do", { pw: curPw, newPw });
      if (res.data.result === "ok") {
        alert("비밀번호가 변경되었습니다.");
        setOpenForm(null);
        resetEditState();
      } else {
        alert("현재 비밀번호가 일치하지 않습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const saveTel = async () => {
    const tel = newTel.trim();
    if (tel !== "" && !TEL_PATTERN.test(tel)) {
      alert("올바른 전화번호 형식으로 입력해 주세요. (예: 010-1234-5678)");
      return;
    }
    try {
      const res = await http.post("/member/changeTel.do", { tel });
      if (res.data.result === "ok") {
        alert("전화번호가 변경되었습니다.");
        setOpenForm(null);
        resetEditState();
        load();
      } else if (res.data.result === "dup") {
        alert("이미 가입된 전화번호입니다.");
      } else {
        alert("변경에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const sendEmailCode = async () => {
    const email = newEmail.trim();
    if (!email || !email.includes("@")) { alert("올바른 이메일을 입력해 주세요."); return; }
    setEmailSending(true);
    try {
      const res = await http.post("/member/sendAuthCode.do", { email });
      if (res.data.result === "ok") {
        setEmailCodeArea(true);
        setEmailVerified(false);
      } else {
        alert("메일 발송에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setEmailSending(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!emailCode.trim()) { alert("인증번호를 입력해 주세요."); return; }
    try {
      const res = await http.post("/member/verifyAuthCode.do", { code: emailCode.trim() });
      if (res.data.result === "ok") {
        setEmailVerified(true);
      } else {
        alert("인증번호가 일치하지 않습니다.");
        setEmailCode("");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const saveEmail = async () => {
    if (!emailVerified) { alert("이메일 인증을 완료해 주세요."); return; }
    try {
      const res = await http.post("/member/changeEmail.do", { email: newEmail.trim() });
      if (res.data.result === "ok") {
        alert("이메일이 변경되었습니다.");
        setOpenForm(null);
        resetEditState();
        load();
      } else if (res.data.result === "dup") {
        alert("이미 가입된 이메일입니다.");
      } else {
        alert("변경에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const openWithdrawModal = () => {
    setWithdrawPw("");
    setShowWithdrawModal(true);
  };

  const confirmWithdraw = async () => {
    if (!withdrawPw) { alert("비밀번호를 입력해 주세요."); return; }
    try {
      const res = await http.post("/member/withdraw.do", { pw: withdrawPw });
      if (res.data.result === "ok") {
        localStorage.removeItem("token");
        localStorage.removeItem("login");
        setShowWithdrawModal(false);
        alert("탈퇴가 완료되었습니다.");
        location.href = "/";
      } else {
        alert("비밀번호가 일치하지 않습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  if (error) return <div className="auth-alert-danger">{error}</div>;
  if (!vo) return <div>불러오는 중...</div>;

  return (
    <div className="profile-wrap">
      <h3>내 정보</h3>
      <div className="profile-card">
        {[
          ["아이디", vo.id],
        ].map(([label, value]) => (
          <div className="profile-row" key={label}>
            <div className="profile-label">{label}</div>
            <div className="profile-value">{value}</div>
          </div>
        ))}
        <div className="profile-row">
          <div className="profile-label">이름</div>
          <div className="profile-value">{vo.name}</div>
        </div>

        <div className="profile-row">
          <div className="profile-label">비밀번호</div>
          <div className="profile-value">
            ****** <button className="btn-olive-outline ms-2" onClick={() => toggleForm("pw")}>수정</button>
          </div>
        </div>
        {openForm === "pw" && (
          <div className="profile-edit-panel">
            <input type="password" className="form-control form-control-sm mb-2" placeholder="현재 비밀번호"
              value={curPw} onChange={(e) => setCurPw(e.target.value)} />
            <input type="password" className="form-control form-control-sm mb-2" placeholder="새 비밀번호 (4~20자)"
              value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            <input type="password" className="form-control form-control-sm mb-2" placeholder="새 비밀번호 확인"
              value={newPw2} onChange={(e) => setNewPw2(e.target.value)} />
            <button className="btn-olive me-1" onClick={savePw}>저장</button>
            <button className="btn-olive-outline" onClick={() => { setOpenForm(null); resetEditState(); }}>취소</button>
          </div>
        )}

        <div className="profile-row">
          <div className="profile-label">성별</div>
          <div className="profile-value">{vo.gender}</div>
        </div>
        <div className="profile-row">
          <div className="profile-label">생년월일</div>
          <div className="profile-value">{vo.birth}</div>
        </div>

        <div className="profile-row">
          <div className="profile-label">연락처</div>
          <div className="profile-value">
            {vo.tel || "미등록"} <button className="btn-olive-outline ms-2" onClick={() => toggleForm("tel")}>수정</button>
          </div>
        </div>
        {openForm === "tel" && (
          <div className="profile-edit-panel">
            <input type="text" className="form-control form-control-sm mb-2" placeholder="예: 010-1234-5678"
              value={newTel} onChange={(e) => setNewTel(e.target.value)} />
            <button className="btn-olive me-1" onClick={saveTel}>저장</button>
            <button className="btn-olive-outline" onClick={() => { setOpenForm(null); resetEditState(); }}>취소</button>
          </div>
        )}

        <div className="profile-row">
          <div className="profile-label">이메일</div>
          <div className="profile-value">
            {vo.email} <button className="btn-olive-outline ms-2" onClick={() => toggleForm("email")}>수정</button>
          </div>
        </div>
        {openForm === "email" && (
          <div className="profile-edit-panel">
            <div className="d-flex gap-2 mb-2">
              <input type="email" className="form-control form-control-sm" placeholder="새 이메일" disabled={emailVerified}
                value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setEmailCodeArea(false); setEmailVerified(false); }} />
              <button className="btn-olive-outline" disabled={emailSending || emailVerified} onClick={sendEmailCode}>
                {emailCodeArea ? "재전송" : "인증번호 받기"}
              </button>
            </div>
            {emailCodeArea && !emailVerified && (
              <div className="d-flex gap-2 mb-2">
                <input type="text" className="form-control form-control-sm" maxLength={6} placeholder="6자리 인증번호"
                  value={emailCode} onChange={(e) => setEmailCode(e.target.value)} />
                <button className="btn-olive-outline" onClick={verifyEmailCode}>확인</button>
              </div>
            )}
            {emailVerified && <div className="small mb-2" style={{ color: "var(--olive-700)" }}>이메일이 인증되었습니다.</div>}
            <button className="btn-olive me-1" onClick={saveEmail}>저장</button>
            <button className="btn-olive-outline" onClick={() => { setOpenForm(null); resetEditState(); }}>취소</button>
          </div>
        )}

        <div className="profile-row">
          <div className="profile-label">등급</div>
          <div className="profile-value">{vo.gradeName}</div>
        </div>
        <div className="profile-row">
          <div className="profile-label">가입일</div>
          <div className="profile-value">{vo.joinDate}</div>
        </div>
        <div className="profile-row">
          <div className="profile-label">최근 로그인</div>
          <div className="profile-value">{vo.lastLogin}</div>
        </div>
      </div>

      <button className="profile-withdraw-btn" onClick={openWithdrawModal}>회원탈퇴</button>

      {showWithdrawModal && (
        <>
          <div className="modal d-block" tabIndex={-1} role="dialog" onClick={() => setShowWithdrawModal(false)}>
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">회원탈퇴</h5>
                  <button type="button" className="btn-close" onClick={() => setShowWithdrawModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p className="text-danger mb-3">탈퇴하면 복구할 수 없습니다. 정말 탈퇴하시겠습니까?</p>
                  <label className="form-label">탈퇴하시려면 비밀번호를 입력해 주세요.</label>
                  <input type="password" className="form-control" value={withdrawPw}
                    onChange={(e) => setWithdrawPw(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") confirmWithdraw(); }} />
                </div>
                <div className="modal-footer">
                  <button className="btn-olive-outline" onClick={() => setShowWithdrawModal(false)}>취소</button>
                  <button className="profile-withdraw-btn" style={{ marginTop: 0 }} onClick={confirmWithdraw}>탈퇴하기</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}
    </div>
  );
}

export default MemberView;
