import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "./member.css";

const STATUS_OPTIONS = ["정상", "휴면", "정지", "탈퇴"];
const GRADE_OPTIONS = [
  { value: 1, label: "일반" },
  { value: 2, label: "점주" },
  { value: 9, label: "관리자" },
];

function statusClass(status) {
  if (status === "정상") return "pill-ok";
  if (status === "탈퇴" || status === "정지" || status === "휴면") return "pill-bad";
  return "pill-neutral";
}
function gradeClass(gradeNo) {
  if (gradeNo === 9) return "pill-admin";
  if (gradeNo === 2) return "pill-owner";
  return "pill-ok";
}

function MemberList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") || 1);
  const keyword = searchParams.get("keyword") || "";
  const status = searchParams.get("status") || "전체";
  const gradeNo = searchParams.get("gradeNo") || "전체";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const [form, setForm] = useState({ keyword, status, gradeNo, dateFrom, dateTo });
  const [list, setList] = useState([]);
  const [pageObject, setPageObject] = useState(null);
  const [edits, setEdits] = useState({});
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendDays, setSuspendDays] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const navigate = useNavigate();

  const load = () => {
    http.get("/member/list.do", {
      params: {
        page,
        keyword: keyword || undefined,
        status: status !== "전체" ? status : undefined,
        gradeNo: gradeNo !== "전체" ? gradeNo : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      },
    })
      .then((res) => {
        setList(res.data.list);
        setPageObject(res.data.pageObject);
        setEdits({});
      })
      .catch((err) => {
        console.error(err);
        alert("회원 목록을 불러오지 못했습니다.");
      });
  };

  useEffect(load, [page, keyword, status, gradeNo, dateFrom, dateTo]);

  const search = (e) => {
    e.preventDefault();
    setSearchParams({ ...form, page: "1" });
  };
  const reset = () => {
    setForm({ keyword: "", status: "전체", gradeNo: "전체", dateFrom: "", dateTo: "" });
    setSearchParams({});
  };
  const goPage = (p) => setSearchParams({ ...form, page: String(p) });

  const setEdit = (id, field, value) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const applyStatus = async (id) => {
    const newStatus = edits[id]?.status;
    if (!newStatus) return;
    if (newStatus === "정지") {
      setSuspendTarget(id);
      setSuspendDays("");
      setSuspendReason("");
      return;
    }
    try {
      const res = await http.post("/member/changeStatus.do", { id, status: newStatus });
      if (res.data.result === "ok") {
        load();
      } else {
        alert(res.data.message || "상태 변경에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const applyGrade = async (id) => {
    const newGrade = edits[id]?.gradeNo;
    if (!newGrade) return;
    try {
      const res = await http.post("/member/changeGrade.do", { id, gradeNo: Number(newGrade) });
      if (res.data.result === "ok") {
        load();
      } else {
        alert(res.data.message || "등급 변경에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("등급 변경 중 오류가 발생했습니다.");
    }
  };

  const confirmSuspend = async () => {
    const days = parseInt(suspendDays, 10);
    if (!days || days < 1) { alert("1 이상의 정지 일수를 입력해 주세요."); return; }
    if (!suspendReason.trim()) { alert("정지 사유를 입력해 주세요."); return; }
    try {
      const res = await http.post("/member/changeStatus.do", {
        id: suspendTarget, status: "정지", days, reason: suspendReason.trim(),
      });
      if (res.data.result === "ok") {
        alert("정지 처리가 완료되었습니다.");
        setSuspendTarget(null);
        load();
      } else {
        alert(res.data.message || "정지 처리에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  return (
    <div className="admin-list-wrap">
      <h3>회원 리스트</h3>

      <form className="admin-filter-card" onSubmit={search}>
        <div className="mb-2">
          <input type="text" className="form-control" placeholder="아이디, 이름, 연락처로 검색"
            value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} />
        </div>
        <div className="row g-2 align-items-end">
          <div className="col-auto">
            <label className="form-label small mb-1">상태</label>
            <select className="form-select form-select-sm" value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="전체">전체</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-auto">
            <label className="form-label small mb-1">등급</label>
            <select className="form-select form-select-sm" value={form.gradeNo}
              onChange={(e) => setForm({ ...form, gradeNo: e.target.value })}>
              <option value="전체">전체</option>
              {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div className="col-auto">
            <label className="form-label small mb-1">가입일(시작)</label>
            <input type="date" className="form-control form-control-sm" value={form.dateFrom}
              onChange={(e) => setForm({ ...form, dateFrom: e.target.value })} />
          </div>
          <div className="col-auto">
            <label className="form-label small mb-1">가입일(종료)</label>
            <input type="date" className="form-control form-control-sm" value={form.dateTo}
              onChange={(e) => setForm({ ...form, dateTo: e.target.value })} />
          </div>
          <div className="col-auto d-flex gap-2">
            <button type="submit" className="admin-search-btn btn-sm">검색</button>
            <button type="button" className="admin-reset-btn btn-sm" onClick={reset}>초기화</button>
          </div>
        </div>
      </form>

      <p className="text-muted small">총 <strong>{pageObject?.totalRow ?? 0}</strong>명</p>

      <div className="admin-table-card table-responsive">
        <table className="table admin-table align-middle mb-0">
          <thead>
            <tr>
              <th>번호</th>
              <th>아이디</th>
              <th>이름</th>
              <th>이메일</th>
              <th>등급</th>
              <th>상태</th>
              <th>가입일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m, i) => (
              <tr key={m.id}>
                <td>{(pageObject?.startRow ?? 1) + i}</td>
                <td>{m.id}</td>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>
                  <div className="d-flex align-items-center gap-1">
                    <select
                      className={"form-select form-select-sm pill-select " + gradeClass(Number(edits[m.id]?.gradeNo ?? m.gradeNo))}
                      style={{ width: 100 }}
                      value={edits[m.id]?.gradeNo ?? m.gradeNo}
                      onChange={(e) => setEdit(m.id, "gradeNo", e.target.value)}>
                      {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                    {edits[m.id]?.gradeNo !== undefined && Number(edits[m.id].gradeNo) !== m.gradeNo && (
                      <button className="admin-inline-btn" onClick={() => applyGrade(m.id)}>수정</button>
                    )}
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-1">
                    <select
                      className={"form-select form-select-sm pill-select " + statusClass(edits[m.id]?.status ?? m.status)}
                      style={{ width: 100 }}
                      value={edits[m.id]?.status ?? m.status}
                      onChange={(e) => setEdit(m.id, "status", e.target.value)}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {edits[m.id]?.status !== undefined && edits[m.id].status !== m.status && (
                      <button className="admin-inline-btn" onClick={() => applyStatus(m.id)}>수정</button>
                    )}
                  </div>
                </td>
                <td>{m.joinDate}</td>
                <td>
                  <button className="btn-olive-outline" onClick={() => navigate(`/member/info?id=${m.id}`)}>
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={8} className="text-center text-muted py-4">데이터가 존재하지 않습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pageObject && pageObject.totalPage > 1 && (
        <nav className="mt-3">
          <ul className="pagination justify-content-center">
            <li className={"page-item" + (page === 1 ? " disabled" : "")}>
              <button className="page-link" disabled={page === 1}
                onClick={() => goPage(1)}>&laquo;</button>
            </li>
            <li className={"page-item" + (pageObject.startPage === 1 ? " disabled" : "")}>
              <button className="page-link" disabled={pageObject.startPage === 1}
                onClick={() => goPage(pageObject.startPage - 1)}>&lt;</button>
            </li>
            {Array.from(
              { length: pageObject.endPage - pageObject.startPage + 1 },
              (_, i) => pageObject.startPage + i
            ).map((p) => (
              <li key={p} className={"page-item " + (p === page ? "active" : "")}>
                <button className="page-link" onClick={() => goPage(p)}>{p}</button>
              </li>
            ))}
            <li className={"page-item" + (pageObject.endPage === pageObject.totalPage ? " disabled" : "")}>
              <button className="page-link" disabled={pageObject.endPage === pageObject.totalPage}
                onClick={() => goPage(pageObject.endPage + 1)}>&gt;</button>
            </li>
            <li className={"page-item" + (page === pageObject.totalPage ? " disabled" : "")}>
              <button className="page-link" disabled={page === pageObject.totalPage}
                onClick={() => goPage(pageObject.totalPage)}>&raquo;</button>
            </li>
          </ul>
        </nav>
      )}

      {suspendTarget && (
        <div className="modal d-block" style={{ background: "rgba(46,58,31,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content suspend-modal-card p-3">
              <h5>⛔ 정지 처리</h5>
              <p className="text-muted small">정지 일수를 입력하면 그 다음날이 정지 해제일이 됩니다.</p>
              <input type="number" min="1" className="form-control mb-2" placeholder="정지 일수 (예: 7)"
                value={suspendDays} onChange={(e) => setSuspendDays(e.target.value)} />
              <textarea className="form-control mb-3" placeholder="정지 사유를 입력하세요."
                value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
              <div className="d-flex justify-content-end gap-2">
                <button className="admin-reset-btn btn-sm" onClick={() => setSuspendTarget(null)}>취소</button>
                <button className="suspend-confirm-btn btn-sm" onClick={confirmSuspend}>확인</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberList;