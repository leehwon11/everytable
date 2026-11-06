import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";

// res_status: 1=결제 전, 2=승인, 3=완료(취소 불가), 4=취소 처리 중, 5=취소
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

function ReservationView() {
  const [searchParams] = useSearchParams();
  const no = searchParams.get("no");
  const [vo, setVo]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason]       = useState("");
  const [cancelDirect, setCancelDirect]       = useState("");
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    http.get("/reservation/view.do", { params: { no } })
      .then((res) => setVo(res.data))
      .catch(() => setError("예약 정보를 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [no]);

  const submitCancel = async (e) => {
    e.preventDefault();
    const reason = cancelReason === "직접 입력" ? cancelDirect : cancelReason;
    if (!reason) { alert("취소 사유를 선택해주세요."); return; }
    try {
      if (vo.resStatus === 1) {
        // 결제 전: 유저가 직접 취소 (점주 권한 불필요)
        await http.post("/reservation/userCancel.do", { resNo: Number(no), cancelReason: reason });
      } else {
        // 승인 후: 점주 검토 필요한 취소 요청
        await http.post("/reservation/cancelRequest.do", { resNo: Number(no), cancelReason: reason });
      }
      setShowCancelModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "처리에 실패했습니다.");
    }
  };

  if (loading) return <div className="text-center py-5 text-muted">불러오는 중...</div>;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (!vo)     return null;

  const canCancel = vo.resStatus === 1 || vo.resStatus === 2;

  return (
    <div className="mx-auto" style={{ maxWidth: 720 }}>
      <h3 className="mb-4">예약 상세 내역</h3>
      <div className="card">
        <div className="card-body">
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <h6 className="text-muted">Reservation Info</h6>
              <table className="table table-sm">
                <tbody>
                  <tr><th>예약 번호</th><td>No.{vo.resNo}</td></tr>
                  <tr><th>매장명</th><td>{vo.storeName}</td></tr>
                  <tr>
                    <th>예약 상태</th>
                    <td><span className={"badge " + statusBadge(vo.resStatus)}>{statusLabel(vo.resStatus)}</span></td>
                  </tr>
                  <tr><th>연락처</th><td>{vo.resPhone}</td></tr>
                  <tr>
                    <th>방문 예정 일시</th>
                    <td className="text-success fw-bold">{vo.resDate} / {vo.resTime}</td>
                  </tr>
                  <tr><th>예약 인원</th><td>{vo.resCount}명 ({vo.resType})</td></tr>
                  {vo.orderAdd && <tr><th>요청 사항</th><td>{vo.orderAdd}</td></tr>}

                  {/* 취소 처리 중(4): 취소 요청 사유 */}
                  {vo.resStatus === 4 && vo.cancelReason && (
                    <tr><th>취소 요청 사유</th><td className="text-secondary">{vo.cancelReason}</td></tr>
                  )}
                  {/* 최종 취소(5): 취소 사유 */}
                  {vo.resStatus === 5 && vo.cancelReason && (
                    <tr><th>취소 사유</th><td className="text-danger">{vo.cancelReason}</td></tr>
                  )}
                  {/* 승인(2): 점주가 취소 거절한 경우 거절 사유 표시 */}
                  {vo.resStatus === 2 && vo.cancelReason && (
                    <tr>
                      <th>취소 거절 사유</th>
                      <td>
                        <span className="text-warning fw-bold">{vo.cancelReason}</span>
                        <div className="small text-muted mt-1">점주가 취소 요청을 거절했습니다.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {vo.resStatus === 4 && (
                <div className="alert alert-secondary py-2 small">
                  취소 요청이 접수되었습니다. 점주 검토 후 처리됩니다.
                </div>
              )}
              {/* 점주 취소 거절 알림 배너 */}
              {vo.resStatus === 2 && vo.cancelReason && (
                <div className="alert alert-warning py-2 small">
                  ⚠️ 취소 요청이 거절되었습니다. 예약은 유지됩니다.
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
                        <td>
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
                <span className="text-success">
                  {vo.totalPrice > 0 ? vo.totalPrice.toLocaleString() + "원" : "결제 정보 없음"}
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-center gap-2 mt-4 pt-3 border-top">
            {/* 결제 전(1): 수정 + 결제 수단 등록 (이미 등록했으면 버튼 숨김) */}
            {vo.resStatus === 1 && (
              <>
                <Link to={`/reservation/updateForm?no=${vo.resNo}`} className="btn btn-dark">
                  예약 수정
                </Link>
                {vo.hasPayment ? (
                  <span className="text-muted small align-self-center">
                    ✅ 결제 수단이 등록되었습니다.
                  </span>
                ) : (
                  <button className="btn btn-success fw-bold"
                    onClick={() => navigate(`/payment/writeForm?resNo=${vo.resNo}&storeNo=${vo.storeNo}&totalPrice=${vo.totalPrice}`)}>
                    💳 결제 수단 등록
                  </button>
                )}
              </>
            )}
            {/* 취소 가능(1, 2): 취소 버튼 */}
            {canCancel && (
              <button className="btn btn-outline-danger"
                onClick={() => { setShowCancelModal(true); setCancelReason(""); setCancelDirect(""); }}>
                {vo.resStatus === 1 ? "예약 취소" : "취소 요청"}
              </button>
            )}
            {/* 완료(3): 리뷰 작성 / 수정 */}
            {vo.resStatus === 3 && (
              vo.reviewNo ? (
                <span className="text-muted">리뷰 작성완료</span>
              ) : (
                <Link
                  to={`/review/writeForm?resNo=${vo.resNo}`}
                  className="btn text-white"
                  style={{ background: "#1a9c82" }}>
                  리뷰 작성
                </Link>
              )
            )}
            <Link to="/reservation/list" className="btn btn-outline-secondary">목록으로</Link>
          </div>
        </div>
      </div>

      {/* 취소 모달 */}
      {showCancelModal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowCancelModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content p-4">
              <h5 className="fw-bold mb-1">{vo.resStatus === 1 ? "예약 취소" : "취소 요청"}</h5>
              <p className="text-muted small mb-3">
                {vo.resStatus === 1 ? "취소 사유를 선택해주세요." : "사유 입력 후 점주 검토를 거쳐 취소됩니다."}
              </p>
              <form onSubmit={submitCancel}>
                <select className="form-select mb-2" required value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}>
                  <option value="">사유 선택 (필수)</option>
                  <option value="개인 사정으로 인한 취소">개인 사정</option>
                  <option value="일정 변경으로 인한 취소">일정 변경</option>
                  <option value="중복 예약으로 인한 취소">중복 예약</option>
                  <option value="직접 입력">기타 (직접 입력)</option>
                </select>
                {cancelReason === "직접 입력" && (
                  <textarea className="form-control mb-2" rows={3} placeholder="취소 사유를 입력해주세요."
                    value={cancelDirect} onChange={(e) => setCancelDirect(e.target.value)} />
                )}
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button type="button" className="btn btn-outline-secondary"
                    onClick={() => setShowCancelModal(false)}>닫기</button>
                  <button type="submit" className="btn btn-danger">
                    {vo.resStatus === 1 ? "취소 확정" : "취소 요청"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationView;