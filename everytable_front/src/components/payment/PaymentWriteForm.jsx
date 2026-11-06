import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/store.css";
import "./payment.css";

function PaymentWriteForm() {
  const [searchParams] = useSearchParams();
  const resNo = searchParams.get("resNo");
  const storeId = searchParams.get("storeId");
  const totalPrice = Number(searchParams.get("totalPrice") || 0);
  const [pickupLabel, setPickupLabel] = useState("");
  const [pickupIso, setPickupIso] = useState(null);
  const [method, setMethod] = useState("신용카드");
  const navigate = useNavigate();

  useEffect(() => {
    http.get("/reservation/view.do", { params: { no: resNo } })
      .then((res) => {
        const { resDate, resTime } = res.data;
        setPickupLabel(`${resDate} / ${resTime}`);
        if (resDate && resTime) setPickupIso(`${resDate}T${resTime}:00`);
      })
      .catch((err) => console.error(err));
  }, [resNo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await http.post("/payment/write.do", {
        orderNo: Number(resNo),
        storeNo: Number(storeId),
        amount: totalPrice,
        method,
        pickupDate: pickupIso,
      });
      alert("결제 수단이 등록되었습니다! 점주 승인 완료 시 자동 결제 처리됩니다.");
      navigate("/payment/list");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "결제 수단 등록에 실패했습니다.");
    }
  };

  return (
    <div className="form-card" style={{ maxWidth: 460 }}>
      <div className="payment-icon-head">
        <div className="emoji">💳</div>
        <h4 className="mb-0">결제 수단 등록</h4>
        <p>점주 승인 후 등록된 수단으로 자동 결제됩니다.</p>
      </div>

      <div className="payment-summary">
        <div className="row-line"><span>예정 금액</span><span className="val price">{totalPrice.toLocaleString()}원</span></div>
        <div className="row-line"><span>픽업일시</span><span className="val">{pickupLabel}</span></div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section-label" style={{ marginTop: 0 }}>결제 수단 선택</div>

        <label className={"payment-method-option" + (method === "신용카드" ? " selected" : "")} htmlFor="card">
          <input type="radio" name="method" id="card"
            checked={method === "신용카드"} onChange={() => setMethod("신용카드")} />
          <div>
            <div className="title">신용/체크카드</div>
            <div className="desc">승인 시 자동 카드 결제</div>
          </div>
        </label>
        <label className={"payment-method-option" + (method === "계좌이체" ? " selected" : "")} htmlFor="transfer">
          <input type="radio" name="method" id="transfer"
            checked={method === "계좌이체"} onChange={() => setMethod("계좌이체")} />
          <div>
            <div className="title">계좌이체</div>
            <div className="desc">승인 시 자동 계좌 출금</div>
          </div>
        </label>

        <div className="d-flex gap-2 mt-3">
          <button type="button" className="btn-form-outline" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn-form-primary flex-grow-1">
            {totalPrice.toLocaleString()}원 결제 수단 등록하기
          </button>
        </div>
      </form>
    </div>
  );
}

export default PaymentWriteForm;