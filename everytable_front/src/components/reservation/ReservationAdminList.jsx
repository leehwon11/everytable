import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "./reservation.css";
import "../store/store.css";

// res_status: 1=결제 전, 2=승인, 3=완료, 4=취소 처리 중, 5=취소
const STATUS = [
  { key: "0", label: "전체" },
  { key: "1", label: "결제 전" },
  { key: "2", label: "승인" },
  { key: "3", label: "완료" },
  { key: "4", label: "취소 처리 중" },
  { key: "5", label: "취소" },
];

const statusPill = (status) => "s" + status;

const statusLabel = (status) => {
  if (status === 1) return "결제 전";
  if (status === 2) return "승인";
  if (status === 3) return "완료";
  if (status === 4) return "취소 처리 중";
  if (status === 5) return "취소";
  return "알 수 없음";
};

function ReservationAdminList() {
  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();
  const isAdmin = login?.gradeNo === 9;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") || 1);
  const key  = searchParams.get("key") || "0";
  const [storeId, setStoreId]   = useState(searchParams.get("storeId") || null);
  const [storeName, setStoreName] = useState("");
  const [list, setList]         = useState([]);
  const [pageObject, setPageObject] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  // 신규 접수 거절 모달
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [rejectReason, setRejectReason]   = useState("");
  const [rejectDirect, setRejectDirect]   = useState("");
  // 취소 처리 중 거절 모달
  const [cancelRejectTarget, setCancelRejectTarget]   = useState(null);
  const [cancelRejectReason, setCancelRejectReason]   = useState("");
  const [cancelRejectDirect, setCancelRejectDirect]   = useState("");

  useEffect(() => {
    setLoading(true);
    const url = storeId ? "/reservation/adminList.do" : "/reservation/adminListAll.do";
    const params = storeId ? { storeNo: storeId, page, key } : { page, key };
    http
      .get(url, { params })
      .then((res) => { setList(res.data.list || []); setPageObject(res.data.pageObject || null); })
      .catch(() => setError("주문 목록을 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [page, key, storeId]);

  useEffect(() => {
    if (!storeId) { setStoreName(""); return; }
    http.get("/store/view.do", { params: { storeId } })
      .then((res) => setStoreName(res.data.storeName))
      .catch(() => setStoreName(""));
  }, [storeId]);

  const paramsFor = (extra) => storeId ? { storeId: String(storeId), ...extra } : { ...extra };
  const reload = () => setSearchParams(paramsFor({ page: String(page), key }));
  const changeStatus = (s) => setSearchParams(paramsFor({ page: "1", key: s }));
  const goPage = (p) => setSearchParams(paramsFor({ page: String(p), key }));

  const approve = async (resNo) => {
    if (!confirm("이 예약을 승인하시겠습니까?")) return;
    try { await http.post("/reservation/adminUpdate.do", { resNo, resStatus: 2 }); reload(); }
    catch { alert("승인 처리에 실패했습니다."); }
  };

  const submitReject = async (e) => {
    e.preventDefault();
    const reason = rejectReason === "직접 입력" ? rejectDirect : rejectReason;
    if (!reason) { alert("거절 사유를 선택해주세요."); return; }
    try {
      await http.post("/reservation/adminCancel.do", { resNo: rejectTarget, cancelReason: reason });
      setRejectTarget(null); reload();
    } catch { alert("거절 처리에 실패했습니다."); }
  };

  const cancelApprove = async (resNo) => {
    if (!confirm("취소 요청을 승인하시겠습니까?")) return;
    try { await http.post("/reservation/cancelApprove.do", { resNo }); reload(); }
    catch { alert("취소 승인 처리에 실패했습니다."); }
  };

  const submitCancelReject = async (e) => {
    e.preventDefault();
    const reason = cancelRejectReason === "직접 입력" ? cancelRejectDirect : cancelRejectReason;
    if (!reason) { alert("거절 사유를 선택해주세요."); return; }
    try {
      await http.post("/reservation/cancelReject.do", { resNo: cancelRejectTarget, rejectReason: reason });
      setCancelRejectTarget(null); reload();
    } catch { alert("거절 처리에 실패했습니다."); }
  };

  if (loading) return <div className="text-center py-5 text-muted">불러오는 중...</div>;
  if (error)   return <div className="res-alert warn" style={{ background: "#FBEAEA", borderColor: "#E3B8B8", color: "#A23E3E" }}>{error}</div>;

  return (
    <>
      <h3 className="mb-1">주문 관리{storeId ? (storeName ? ` · ${storeName}` : "") : " · 전체 매장"}</h3>
      <p className="text-muted small mb-3">접수된 예약 및 주문을 확인하고 승인·거절 처리하세요.</p>

      <div className="res-status-tabs">
        {STATUS.map((s) => (
          <button key={s.key} type="button"
            className={"res-status-tab" + (key === s.key ? " active" : "")}
            onClick={() => changeStatus(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-muted">접수된 주문이 없습니다.</p>
      ) : (
        list.map((r) => (
          <div key={r.resNo} className="res-admin-card">
            <div className="res-admin-top">
              <div>
                <div className="res-admin-meta">No.{r.resNo} · 접수 {r.resCreatedAt}{!storeId && ` · ${r.storeName}`}</div>
                <div className="res-admin-name">{r.userName} · {r.resPhone}</div>
              </div>
              <span className={"res-pill " + statusPill(r.resStatus)}>{statusLabel(r.resStatus)}</span>
            </div>
            <div className="res-admin-info">
              {r.resDate} {r.resTime} · {r.resCount}명 / {r.resType} ·{" "}
              {r.totalPrice != null ? r.totalPrice.toLocaleString() + "원" : "-"}
            </div>
            {r.resStatus === 4 && r.cancelReason && (
              <div className="res-admin-note pending">취소 요청 사유: {r.cancelReason}</div>
            )}
            {r.resStatus === 5 && r.cancelReason && (
              <div className="res-admin-note rejected">취소 사유: {r.cancelReason}</div>
            )}
            <div className="res-admin-actions">
              <Link to={`/reservation/adminView?no=${r.resNo}&storeId=${r.storeNo}`} className="btn-res-sm outline">상세보기</Link>
              {/* 결제 전(1): 승인 / 거절 - 매장 운영 판단이라 점주만 처리 (관리자는 조회만) */}
              {!isAdmin && r.resStatus === 1 && (
                <>
                  <button className="btn-res-sm approve" onClick={() => approve(r.resNo)}>승인</button>
                  <button className="btn-res-sm reject"
                    onClick={() => { setRejectTarget(r.resNo); setRejectReason(""); setRejectDirect(""); }}>
                    거절
                  </button>
                </>
              )}
              {/* 취소 처리 중(4): 취소 승인 / 취소 거절 */}
              {!isAdmin && r.resStatus === 4 && (
                <>
                  <button className="btn-res-sm reject" onClick={() => cancelApprove(r.resNo)}>취소 승인</button>
                  <button className="btn-res-sm outline"
                    onClick={() => { setCancelRejectTarget(r.resNo); setCancelRejectReason(""); setCancelRejectDirect(""); }}>
                    취소 거절
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      )}

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

      {storeId && (
        <button type="button" className="btn-res-sm outline mb-2" onClick={() => navigate(-1)}>
          돌아가기
        </button>
      )}

      {/* 신규 접수 거절 모달 */}
      {rejectTarget && (
        <div className="modal d-block" style={{ background: "rgba(46,58,31,0.45)" }}
          onClick={() => setRejectTarget(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content p-3">
              <h5 className="mb-1">거절 사유 입력</h5>
              <p className="text-muted small">사용자에게 전달될 거절 사유를 선택하거나 직접 입력하세요.</p>
              <form onSubmit={submitReject}>
                <select className="form-select mb-2" required value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}>
                  <option value="">사유 선택 (필수)</option>
                  <option value="재료 소진으로 인한 주문 불가">재료 소진</option>
                  <option value="해당 시간대 예약 만석">예약 만석</option>
                  <option value="개인 사정으로 인한 임시 휴무">임시 휴무</option>
                  <option value="직접 입력">기타 (직접 입력)</option>
                </select>
                {rejectReason === "직접 입력" && (
                  <textarea className="form-control mb-2" rows={3} placeholder="기타 사유를 입력해주세요."
                    value={rejectDirect} onChange={(e) => setRejectDirect(e.target.value)} />
                )}
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn-res-outline"
                    onClick={() => setRejectTarget(null)}>취소</button>
                  <button type="submit" className="btn-res-danger">거절 처리</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 취소 처리 중 거절 모달 */}
      {cancelRejectTarget && (
        <div className="modal d-block" style={{ background: "rgba(46,58,31,0.45)" }}
          onClick={() => setCancelRejectTarget(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content p-3">
              <h5 className="mb-1">취소 요청 거절</h5>
              <p className="text-muted small mb-2">거절 시 예약은 승인 상태로 복귀됩니다.</p>
              <form onSubmit={submitCancelReject}>
                <select className="form-select mb-2" required value={cancelRejectReason}
                  onChange={(e) => setCancelRejectReason(e.target.value)}>
                  <option value="">사유 선택 (필수)</option>
                  <option value="이미 준비가 완료된 주문입니다">준비 완료된 주문</option>
                  <option value="취소 가능 기한이 지났습니다">취소 기한 초과</option>
                  <option value="직접 입력">기타 (직접 입력)</option>
                </select>
                {cancelRejectReason === "직접 입력" && (
                  <textarea className="form-control mb-2" rows={3}
                    value={cancelRejectDirect} onChange={(e) => setCancelRejectDirect(e.target.value)} />
                )}
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn-res-outline" onClick={() => setCancelRejectTarget(null)}>닫기</button>
                  <button type="submit" className="btn-res-danger">거절 확정</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ReservationAdminList;
