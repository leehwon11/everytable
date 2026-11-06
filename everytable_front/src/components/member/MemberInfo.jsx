import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "./member.css";

// 원본 member/memberInfo.jsp(관리자 회원 상세) 이식.
function MemberInfo() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [vo, setVo] = useState(null);
  const [suspensionList, setSuspensionList] = useState([]);
  const [showPwForm, setShowPwForm] = useState(false);
  const [newPw, setNewPw] = useState("");

  const load = () => {
    if (!id) return;
    http.get("/member/memberInfo.do", { params: { id } })
      .then((res) => {
        setVo(res.data.vo);
        setSuspensionList(res.data.suspensionList || []);
      })
      .catch((err) => {
        console.error(err);
        alert("회원 정보를 불러오지 못했습니다.");
      });
  };

  useEffect(load, [id]);

  const resetPw = async () => {
    const pw = newPw.trim();
    if (!pw) { alert("초기화할 비밀번호를 입력해 주세요."); return; }
    if (pw.length < 4 || pw.length > 20) { alert("비밀번호는 4~20자로 입력해 주세요."); return; }
    if (!confirm("정말 비밀번호를 초기화하시겠습니까?")) return;
    try {
      const res = await http.post("/member/adminResetPw.do", { id, newPw: pw });
      if (res.data.result === "ok") {
        alert("비밀번호가 초기화되었습니다.");
        setShowPwForm(false);
        setNewPw("");
      } else {
        alert("초기화에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  if (!vo) return null;

  const row = (label, value) => (
    <div className="profile-row">
      <div className="profile-label">{label}</div>
      <div className="profile-value">{value}</div>
    </div>
  );

  return (
    <div className="profile-wrap">
      <h3>회원 상세 정보</h3>

      <div className="profile-card">
        {row("회원번호", vo.no)}
        {row("이름", vo.name)}
        {row("아이디", vo.id)}
        <div className="profile-row">
          <div className="profile-label">비밀번호</div>
          <div className="profile-value">
            ******
            {vo.status !== "파기" && (
              <button className="btn-olive-outline ms-2" onClick={() => setShowPwForm((v) => !v)}>초기화</button>
            )}
          </div>
        </div>
        {showPwForm && (
          <div className="profile-edit-panel">
            <input type="password" className="form-control form-control-sm mb-2"
              placeholder="초기화할 비밀번호 입력 (4~20자)"
              value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            <button className="btn-olive me-1" onClick={resetPw}>초기화 적용</button>
            <button className="btn-olive-outline" onClick={() => { setShowPwForm(false); setNewPw(""); }}>취소</button>
          </div>
        )}
        {row("연락처", vo.tel || "미등록")}
        {row("이메일", vo.email)}
        {row("성별", vo.gender)}
        {row("생년월일", vo.birth)}
        {row("상태", vo.status)}
        {row("등급", vo.gradeName)}
        {row("가입일", vo.joinDate)}
        {row("최근 접속일", vo.lastLogin)}
        {vo.withdrawDate && row("탈퇴일", vo.withdrawDate)}
        {vo.suspensionEndDate && row("정지해제일", vo.suspensionEndDate)}
      </div>

      {suspensionList.length > 0 && (
        <div className="mt-3">
          <h6 className="fw-bold mb-2">⛔ 정지 내역 <span className="text-muted small">(총 {suspensionList.length}건)</span></h6>
          <table className="table table-sm bg-white suspension-table">
            <thead>
              <tr><th>정지 시작일</th><th>정지 해제일</th><th>사유</th><th>처리 관리자</th></tr>
            </thead>
            <tbody>
              {suspensionList.map((s) => (
                <tr key={s.susNo}>
                  <td>{s.startDate}</td>
                  <td>{s.endDate}</td>
                  <td>{s.reason}</td>
                  <td>{s.adminName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3">
        <Link to="/member/list" className="btn-olive" style={{ textDecoration: "none", display: "inline-block" }}>리스트</Link>
      </div>
    </div>
  );
}

export default MemberInfo;
