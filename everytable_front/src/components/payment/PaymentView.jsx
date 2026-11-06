import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import http from "../../api/http";
import "./payment.css";

const statusLabel = (status) => {
  if (status === "SUCCESS") return "결제 완료";
  if (status === "PENDING") return "결제 대기";
  if (status === "REFUNDED") return "환불 완료";
  if (status === "FAIL") return "결제 실패";
  return status;
};

function PaymentView() {
  const [searchParams] = useSearchParams();
  const no = searchParams.get("no");
  const [vo, setVo] = useState(null);
  const [diffHours, setDiffHours] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();
  const isAdmin = login?.gradeNo === 9;

  useEffect(() => {
    if (!no) {
      alert("잘못된 접근입니다.");
      navigate("/payment/list");
      return;
    }

    http.get("/payment/view.do", { params: { no } })
      .then((res) => {
        const paymentData = res.data;
        setVo(paymentData);

        if (paymentData.pickupDate) {
          const pickup = new Date(paymentData.pickupDate);
          const now = new Date();
          const hours = Math.floor((pickup - now) / (1000 * 60 * 60));
          setDiffHours(hours);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("결제 정보를 불러오지 못했습니다.");
      });
  }, [no, navigate]);

  if (error) {
    return (
      <div className="form-card text-center" style={{ maxWidth: 480 }}>
        <p style={{ color: "#A23E3E" }}>{error}</p>
        <button className="btn-form-outline mt-3" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  if (!vo) return null;

  return (
    <div className="form-card" style={{ maxWidth: 560 }}>
      <h4 className="mb-4">결제 상세 정보</h4>
      
      <div className="payment-row">
        <div className="payment-label">주문번호</div>
        <div className="payment-value">{vo.orderNo}</div>
      </div>

      <div className="payment-row">
        <div className="payment-label">사용자</div>
        <div className="payment-value">{vo.userName || "-"}</div>
      </div>

      <div className="payment-row">
        <div className="payment-label">결제수단</div>
        <div className="payment-value">{vo.method}</div>
      </div>

      <div className="payment-row">
        <div className="payment-label">결제금액</div>
        <div className="payment-value amount" style={{ color: "#A23E3E" }}>{vo.amount.toLocaleString()}원</div>
      </div>

      <div className="payment-row">
        <div className="payment-label">결제상태</div>
        <div className="payment-value">{statusLabel(vo.status)}</div>
      </div>

      <div className="payment-row">
        <div className="payment-label">결제일</div>
        <div className="payment-value">{vo.payDate || "-"}</div>
      </div>

      <div className="payment-row">
        <div className="payment-label">픽업 예정일</div>
        <div className="payment-value">{vo.pickupDate || "-"}</div>
      </div>

      <div className="d-flex gap-2 mt-4 align-items-center">
        <Link to="/payment/list" className="btn-form-outline" style={{ textDecoration: "none", textAlign: "center" }}>리스트</Link>

        {vo.status === "SUCCESS" && !isAdmin && diffHours !== null && diffHours >= 12 && (
          <Link to={`/refund/refundForm?no=${vo.paymentNo}`} className="btn-payment-danger" style={{ flex: 1, textAlign: "center" }}>주문 취소 (환불신청)</Link>
        )}

        {vo.status === "SUCCESS" && !isAdmin && diffHours !== null && diffHours < 12 && (
          <span className="payment-notice-text text-muted">※ 픽업 12시간 이내이므로 취소가 불가합니다.</span>
        )}

        {vo.status === "REFUNDED" && (
          <span className="payment-notice-text text-muted">이미 환불 처리가 완료된 주문입니다.</span>
        )}
      </div>
    </div>
  );
}

export default PaymentView;