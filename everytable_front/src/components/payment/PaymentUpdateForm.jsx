import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/store.css";
import "./payment.css";

// 원본 payment/updateForm.jsp 이식 - 관리자 전용 결제 상태 변경
function PaymentUpdateForm() {
  const [searchParams] = useSearchParams();
  const no = searchParams.get("no");
  const [vo, setVo] = useState(null);
  const [status, setStatus] = useState("SUCCESS");
  const navigate = useNavigate();

  useEffect(() => {
    http.get("/payment/view.do", { params: { no } })
      .then((res) => { setVo(res.data); setStatus(res.data.status); })
      .catch((err) => console.error(err));
  }, [no]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await http.post("/payment/update.do", { no: Number(no), status });
      alert("정보가 변경되었습니다.");
      navigate(`/payment/view?no=${no}`);
    } catch (err) {
      console.error(err);
      alert("변경에 실패했습니다.");
    }
  };

  if (!vo) return null;

  return (
    <div className="form-card" style={{ maxWidth: 460 }}>
      <h4>결제 정보 수정</h4>
      <p className="form-subtitle">주문번호 {vo.orderNo}</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">주문번호</label>
          <input type="text" className="form-control" value={vo.orderNo} readOnly disabled />
        </div>
        <div className="mb-3">
          <label className="form-label">구매자 아이디</label>
          <input type="text" className="form-control" value={vo.userName} readOnly disabled />
        </div>
        <div className="mb-3">
          <label className="form-label">결제 금액</label>
          <input type="text" className="form-control" value={vo.amount.toLocaleString()} readOnly disabled />
        </div>
        <div className="mb-3">
          <label className="form-label">결제 상태 변경</label>
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PENDING">결제 대기(PENDING)</option>
            <option value="SUCCESS">결제 완료(SUCCESS)</option>
            <option value="FAIL">결제 실패(FAIL)</option>
            <option value="REFUNDED">환불 처리(REFUNDED)</option>
          </select>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button type="submit" className="btn-form-primary">수정 완료</button>
          <button type="button" className="btn-form-outline" onClick={() => navigate(-1)}>취소</button>
        </div>
      </form>
    </div>
  );
}

export default PaymentUpdateForm;