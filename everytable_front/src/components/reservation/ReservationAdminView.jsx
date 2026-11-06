import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";

// res_status: 1=결제 전, 2=승인, 3=완료, 4=취소 처리 중, 5=취소
const statusLabel = (status) => {
  if (status === 1) return "결제 전";
  if (status === 2) return "예약 확정";
  if (status === 3) return "이용 완료";
  if (status === 4) return "취소 처리 중";
  if (status === 5) return "취소됨";
  return String(status);
};

const statusBadge = (status) => {
  if (status === 1) return "bg-warning text-dark";
  if (status === 2) return "bg-primary";
  if (status === 3) return "bg-success";
  if (status === 4) return "bg-secondary";
  if (status === 5) return "bg-danger";
  return "bg-secondary";
};

function ReservationAdminView() {
  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();
  const isAdmin = login?.gradeNo === 9;
  const [searchParams] = useSearchParams();
  const no      = searchParams.get("no");
  const storeId = searchParams.get("storeId");
  const [vo, setVo]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showReject, setShowReject]               = useState(false);
  const [rejectReason, setRejectReason]           = useState("");
  const [rejectDirect, setRejectDirect]           = useState("");
  const [showCancelReject, setShowCancelReject]   = useState(false);
  const [cancelRejectReason, setCancelRejectReason] = useState("");
  const [cancelRejectDirect, setCancelRejectDirect] = useState("");
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    http.get("/reservation/view.do", { params: { no } })
      .then((res) => setVo(res.data))
      .catch(() => setError("예약 정보를 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [no]);

  const approve = async () => {
    if (!confirm("이 예약을 승인하시겠습니까?")) return;
    try { await http.post("/reservation/adminUpdate.do", { resNo: Number(no), resStatus: 2 }); load(); }
    catch { alert("승인 처리에 실패했습니다."); }
  };

  const complete = async () => {
    if (!confirm("이용 완료 처리하시겠습니까?")) return;
    try { await http.post("/reservation/adminUpdate.do", { resNo: Number(no), resStatus: 3 }); load(); }
    catch { alert("완료 처리에 실패했습니다."); }
  };

  const submitReject = async (e) => {
    e.preventDefault();
    const reason = rejectReason === "직접 입력" ? rejectDirect : rejectReason;
    if (!reason) { alert("거절 사유를 선택해주세요."); return; }
    try {
      await http.post("/reservation/adminCancel.do", { resNo: Number(no), cancelReason: reason });
      setShowReject(false); load();
    } catch { alert("거절 처리에 실패했습니다."); }
  };

  const cancelApprove = async () => {
    if (!confirm("취소 요청을 승인하시겠습니까?")) return;
    try { await http.post("/reservation/cancelApprove.do", { resNo: Number(no) }); load(); }
    catch { alert("취소 승인 처리에 실패했습니다."); }
  };

  const submitCancelReject = async (e) => {
    e.preventDefault();
    const reason = cancelRejectReason === "직접 입력" ? cancelRejectDirect : cancelRejectReason;
    if (!reason) { alert("거절 사유를 입력해주세요."); return; }
    try {
      await http.post("/reservation/cancelReject.do", { resNo: Number(no), rejectReason: reason });
      setShowCancelReject(false); load();
    } catch { alert("거절 처리에 실패했습니다."); }
  };

  if (loading) return <div className="text-center py-5 text-muted">불러오는 중...</div>;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (!vo)     return null;

  return (
    <div className="mx-auto" style={{ maxWidth: 720 }}>
      <h3 className="mb-1">매장 주문 관리</h3>
      <p className="text-muted small mb-4">접수된 예약 정보를 확인하고 승인 또는 거절 처리를 진행하세요.</p>

      <div className="card">
        <div className="card-body">
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <h6 className="text-muted">Customer &amp; Visit Info</h6>
              <table className="table table-sm">
                <tbody>
                  <tr><th>예약 번호</th><td>No.{vo.resNo}</td></tr>
                  <tr><th>예약자</th><td>{vo.userName}</td></tr>
                  <tr><th>연락처</th><td>{vo.resPhone}</td></tr>
                  <tr>
                    <th>예약 상태</th>
                    <td><span className={"badge " + statusBadge(vo.resStatus)}>{statusLabel(vo.resStatus)}</span></td>
                  </tr>
                  <tr>
                    <th>방문 예정 일시</th>
                    <td className="text-success fw-bold">{vo.resDate} / {vo.resTime}</td>
                  </tr>
                  <tr><th>인원 / 유형</th><td>{vo.resCount}명 ({vo.resType})</td></tr>
                  {vo.orderAdd && <tr><th>요청 사항</th><td>{vo.orderAdd}</td></tr>}
                  {vo.resStatus === 4 && vo.cancelReason && (
                    <tr><th>취소 요청 사유</th><td className="text-secondary fw-bold">{vo.cancelReason}</td></tr>
                  )}
                  {vo.resStatus === 5 && vo.cancelReason && (
                    <tr><th>취소 사유</th><td className="text-danger">{vo.cancelReason}</td></tr>
                  )}
                </tbody>
              </table>
              {vo.resStatus === 4 && (
                <div className="alert alert-warning py-2 small">
                  ⚠️ 고객이 취소를 요청했습니다. 아래에서 승인 또는 거절하세요.
                </div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <h6 className="text-muted">Order Menu</h6>
              <table className="table table-sm">
                <thead>
                  <tr><th>메뉴명</th><th className="text-center">수량</th><th className="text-end">소계</th></tr>
                </thead>
                <tbody>
                  {(vo.orderList || []).length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-muted">주문 메뉴 정보가 없습니다.</td></tr>
                  ) : (
                    (vo.orderList || []).map((item) => (
                      <tr key={item.ordersNo}>
                        <td className="fw-bold">
                          {item.menuName}
                          {item.op && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                              {item.op.split(",").map((s, i) => {
                                const idx = s.indexOf("=");
                                const name = s.slice(0, idx).trim();
                                const value = s.slice(idx + 1).trim();
                                return (
                                  <span key={i} style={{
                                    fontSize: 11, background: "var(--cream)",
                                    color: "var(--olive-700)", border: "1px solid var(--border)",
                                    borderRadius: 5, padding: "1px 7px", fontWeight: 600
                                  }}>{name}: {value}</span>
                                );
                              })}
                            </div>
                          )}
                          {item.adds && (
                            <div className="text-muted small mt-1">💬 {item.adds}</div>
                          )}
                        </td>
                        <td className="text-center">{item.quantity}개</td>
                        <td className="text-end">{(item.price * item.quantity).toLocaleString()}원</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="d-flex justify-content-between border-top pt-2 fw-bold">
                <span>최종 결제 금액</span>
                <span className="text-success">{vo.totalPrice ? vo.totalPrice.toLocaleString() + "원" : "-"}</span>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            {/* 결제 전(1): 승인 / 거절 - 매장 운영 판단이라 점주만 처리 */}
            {!isAdmin && vo.resStatus === 1 && (
              <>
                <button className="btn btn-success" onClick={approve}>주문 승인</button>
                <button className="btn btn-outline-danger"
                  onClick={() => { setRejectReason(""); setRejectDirect(""); setShowReject(true); }}>
                  주문 거절
                </button>
              </>
            )}
            {/* 승인(2): 예약 날짜+시간이 지난 후에만 이용 완료 버튼 표시 */}
            {!isAdmin && vo.resStatus === 2 && (() => {
              const resDateTime = new Date(`${vo.resDate}T${vo.resTime}`);
              const now = new Date();
              return resDateTime < now ? (
                <button className="btn btn-success" onClick={complete}>이용 완료</button>
              ) : (
                <span className="text-muted small align-self-center">
                  {vo.resDate} {vo.resTime} 이후 완료 처리 가능
                </span>
              );
            })()}
            {/* 취소 처리 중(4): 취소 승인 / 취소 거절 */}
            {!isAdmin && vo.resStatus === 4 && (
              <>
                <button className="btn btn-danger" onClick={cancelApprove}>취소 승인</button>
                <button className="btn btn-outline-secondary"
                  onClick={() => { setCancelRejectReason(""); setCancelRejectDirect(""); setShowCancelReject(true); }}>
                  취소 거절
                </button>
              </>
            )}
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
              목록으로
            </button>
          </div>
        </div>
      </div>

      {/* 신규 접수 거절 모달 */}
      {showReject && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowReject(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content p-3">
              <h5 className="mb-2">주문 거절 사유 입력</h5>
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
                  <textarea className="form-control mb-2" rows={3} placeholder="상세 사유를 입력해주세요."
                    value={rejectDirect} onChange={(e) => setRejectDirect(e.target.value)} />
                )}
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light" onClick={() => setShowReject(false)}>취소</button>
                  <button type="submit" className="btn btn-danger">거절 확정</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 취소 처리 중 거절 모달 */}
      {showCancelReject && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowCancelReject(false)}>
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
                  <button type="button" className="btn btn-light" onClick={() => setShowCancelReject(false)}>닫기</button>
                  <button type="submit" className="btn btn-warning">거절 확정</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationAdminView;