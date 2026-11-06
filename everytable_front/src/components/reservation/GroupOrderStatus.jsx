import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "./reservation.css";

const POLL_INTERVAL = 10000;

// "맵기=매운맛,곱배기=O" → [{name, value}, ...]
const parseOp = (op) =>
  op ? op.split(",").map((s) => {
    const idx = s.indexOf("=");
    return { name: s.slice(0, idx).trim(), value: s.slice(idx + 1).trim() };
  }) : [];

function GroupOrderStatus() {
  const [searchParams] = useSearchParams();
  const resNo   = searchParams.get("resNo");
  const [orderList, setOrderList]         = useState([]);
  const [total, setTotal]                 = useState(0);
  const [minOrderPrice, setMinOrderPrice] = useState(0);
  const [orderAdd, setOrderAdd]           = useState("");
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [lastUpdated, setLastUpdated]     = useState(null);
  const navigate = useNavigate();

  const load = useCallback(() => {
    http.get("/reservation/groupOrderStatus.do", { params: { resNo } })
      .then((res) => {
        setOrderList(res.data.orderList || []);
        setTotal(res.data.total || 0);
        setMinOrderPrice(res.data.minOrderPrice || 0);
        setLastUpdated(new Date());
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [resNo]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  const confirmFinalOrder = async () => {
    if (orderList.length === 0) {
      alert("아직 선택된 메뉴가 없습니다. 팀원들의 선택을 기다려주세요.");
      return;
    }
    if (!confirm("정말로 주문을 확정하시겠습니까?\n이후에는 메뉴 수정 및 요청사항 변경이 불가능합니다.")) return;
    setSubmitting(true);
    try {
      const res = await http.post("/reservation/finalOrder.do", { resNo: Number(resNo), orderAdd });
      navigate(`/payment/writeForm?resNo=${res.data.resNo}&storeNo=${res.data.storeNo}&totalPrice=${res.data.totalPrice}`);
    } catch (err) {
      alert(err.response?.data?.message || "주문 확정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-5 text-muted">불러오는 중...</div>;

  const canConfirm = orderList.length > 0 && !(minOrderPrice > 0 && total < minOrderPrice);

  return (
    <div className="mx-auto pb-5" style={{ maxWidth: 640 }}>

      {/* 헤더 */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0" style={{ color: "var(--ink)" }}>주문 취합 현황</h3>
          <p className="mb-0 small" style={{ color: "var(--muted)" }}>
            10초마다 자동 갱신
            {lastUpdated && <span className="ms-1">· 마지막 갱신 {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button className="btn-res-outline" style={{ padding: "6px 14px", fontSize: 13 }} onClick={load}>
          🔄 새로고침
        </button>
      </div>

      {/* 메뉴 목록 카드 */}
      <div className="res-detail-card mb-3" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--cream)" }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--olive-700)" }}>🛒 주문 메뉴</span>
        </div>

        {orderList.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
            아직 선택된 메뉴가 없습니다.<br />팀원들의 참여를 기다려주세요.
          </div>
        ) : (
          orderList.map((item, i) => {
            const opts = parseOp(item.op);
            return (
              <div key={i} style={{
                padding: "16px 20px",
                borderBottom: i < orderList.length - 1 ? "1px solid var(--border)" : "none"
              }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div style={{ flex: 1 }}>
                    {/* 메뉴명 + 수량 */}
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: 5 }}>
                      {item.menuName}
                      <span style={{ fontWeight: 500, fontSize: 13, color: "var(--muted)", marginLeft: 8 }}>
                        × {item.quantity}개
                      </span>
                    </div>

                    {/* 옵션 태그 */}
                    {opts.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                        {opts.map((o, oi) => (
                          <span key={oi} style={{
                            fontSize: 11.5, background: "var(--cream)",
                            color: "var(--olive-700)", border: "1px solid var(--border)",
                            borderRadius: 6, padding: "2px 9px", fontWeight: 600
                          }}>
                            {o.name}: {o.value}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 개인 요청사항 (중복 제거된 것만) */}
                    {item.adds && (
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        💬 {item.adds}
                      </div>
                    )}
                  </div>

                  {/* 소계 */}
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--olive-700)", marginLeft: 16, whiteSpace: "nowrap" }}>
                    {(item.price * item.quantity).toLocaleString()}원
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* 합계 */}
        {orderList.length > 0 && (
          <div className="res-order-total" style={{ margin: 0, padding: "14px 20px", background: "var(--cream)" }}>
            <span>총 합계</span>
            <span>{total.toLocaleString()}원</span>
          </div>
        )}
      </div>

      {/* 최소 주문금액 경고 */}
      {minOrderPrice > 0 && total < minOrderPrice && (
        <div className="res-alert warn mb-3">
          ⚠️ 최소 주문금액 <strong>{minOrderPrice.toLocaleString()}원</strong>을 충족하지 못했습니다.
          <span className="ms-1" style={{ fontSize: 12 }}>({(minOrderPrice - total).toLocaleString()}원 더 필요)</span>
        </div>
      )}

      {/* 매장 요청사항 */}
      <div className="res-detail-card mb-4">
        <label style={{ fontWeight: 700, fontSize: 13.5, color: "var(--olive-700)", display: "block", marginBottom: 10 }}>
          📢 매장 요청사항
          <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: 12, marginLeft: 6 }}>(방장만 입력)</span>
        </label>
        <textarea className="form-control" rows={3}
          placeholder="매장에 전달할 요청사항을 입력해주세요."
          value={orderAdd} onChange={(e) => setOrderAdd(e.target.value)} />
      </div>

      {/* 확정 버튼 */}
      <button className="btn-res-success" onClick={confirmFinalOrder}
        disabled={submitting || !canConfirm}
        style={{
          width: "100%", padding: "15px", fontSize: 16, textAlign: "center",
          opacity: (!canConfirm || submitting) ? 0.5 : 1,
          cursor: (!canConfirm || submitting) ? "not-allowed" : "pointer"
        }}>
        {submitting ? "처리 중..." : `${total.toLocaleString()}원 · 주문 확정하기`}
      </button>
    </div>
  );
}

export default GroupOrderStatus;