import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/store.css";
import "../payment/payment.css";

function RefundForm() {
  const [searchParams] = useSearchParams();
  const no = searchParams.get("no");
  const [data, setData] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!no) {
      alert("잘못된 접근입니다. 결제 번호가 없어요!");
      navigate("/payment/list");
      return;
    }
    http.get("/refund/refundForm.do", { params: { no } })
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || "환불 신청 정보를 불러오지 못했습니다.");
      });
  }, [no]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("환불 사유를 입력해주세요.");
      return;
    }
    try {
      await http.post("/refund/refund.do", {
        orderNo: data.vo.orderNo,       // orderId -> orderNo
        paymentNo: data.vo.paymentNo,   // paymentId -> paymentNo
        refundRate: data.refundRate,
        refundAmount: data.refundAmount,
        reason,
      });
      alert("환불 신청이 완료되었습니다! 매장 승인 후 환불 처리됩니다.");
      navigate(`/payment/view?no=${data.vo.paymentNo}`);
    } catch (err) {
      console.error(err);
      alert("환불 처리에 실패했습니다.");
    }
  };

  if (error) {
    return (
      <div className="form-card text-center" style={{ maxWidth: 480 }}>
        <p style={{ color: "#A23E3E" }}>{error}</p>
        <button className="btn-form-outline" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="form-card" style={{ maxWidth: 560 }}>
      <h4>환불 신청</h4>
      <p className="form-subtitle">신청 내용을 확인한 뒤 환불 사유를 입력해 주세요.</p>
      <form onSubmit={handleSubmit}>
        <div className="payment-row"><div className="payment-label">주문번호</div><div className="payment-value">{data.vo.orderNo}</div></div>
        <div className="payment-row"><div className="payment-label">결제금액</div><div className="payment-value">{data.vo.amount.toLocaleString()}원</div></div>
        <div className="payment-row"><div className="payment-label">환불 규정</div><div className="payment-value payment-notice-text">{data.policyNotice}</div></div>
        <div className="payment-row"><div className="payment-label">환불 비율</div><div className="payment-value">{data.refundRate}% 환불 가능</div></div>
        <div className="payment-row">
          <div className="payment-label">최종 환불 금액</div>
          <div className="payment-value amount" style={{ color: "#A23E3E" }}>{data.refundAmount.toLocaleString()}원</div>
        </div>

        <div className="form-section-label">환불 사유</div>
        <textarea className="form-control" rows={3} placeholder="환불 사유를 입력해 주세요." required
          value={reason} onChange={(e) => setReason(e.target.value)} />

        <div className="d-flex gap-2 mt-3">
          <button type="submit" className="btn-payment-danger" style={{ flex: 1, textAlign: "center", border: "1px solid #E3B8B8" }}>환불 신청하기</button>
          <button type="button" className="btn-form-outline" onClick={() => navigate(-1)}>취소</button>
        </div>
      </form>
    </div>
  );
}

export default RefundForm;