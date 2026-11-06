import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/store.css";

function ReservationWriteForm() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("storeId");
  const [store, setStore]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resPhone, setResPhone] = useState("");
  const [resDate, setResDate]   = useState("");
  const [resTime, setResTime]   = useState("");
  const [resCount, setResCount] = useState("");
  const [resType, setResType]   = useState("단체");
  const navigate = useNavigate();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();

  useEffect(() => {
    // 로그인 체크 - 비로그인이면 로그인 페이지로
    if (!login) {
      alert("예약하려면 로그인이 필요합니다.");
      navigate("/member/login");
      return;
    }
    if (login.gradeNo === 9) {
      alert("관리자 계정으로는 예약할 수 없습니다.");
      navigate("/");
      return;
    }
    if (!storeId) {
      alert("매장 정보가 없습니다. 다시 시도해주세요.");
      navigate("/");
      return;
    }
    http.get("/store/view.do", { params: { storeId } })
      .then((res) => setStore(res.data))
      .catch(() => { alert("매장 정보를 불러오는 데 실패했습니다."); navigate("/"); })
      .finally(() => setLoading(false));
  }, [storeId]);

  const today = new Date().toISOString().split("T")[0];

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
    setResPhone(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (resPhone.length < 10 || resPhone.length > 11) {
      alert("연락처를 정확히 입력해주세요. (10~11자리 숫자)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await http.post("/reservation/write.do", {
        storeNo: Number(storeId),
        resDate, resTime,
        resCount: Number(resCount),
        resPhone, resType,
      });
      navigate(`/reservation/groupShare?resNo=${res.data.resNo}&storeId=${res.data.storeNo}`);
    } catch (err) {
      alert(err.response?.data?.message || "예약 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-5 text-muted">불러오는 중...</div>;

  return (
    <div className="form-card" style={{ maxWidth: 560 }}>
      <h4>📅 예약 정보 입력</h4>
      <p className="form-subtitle">방문 일시와 인원을 입력해 주세요. 다음 단계에서 메뉴를 선택합니다.</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">예약 매장</label>
          <input type="text" className="form-control" value={store?.storeName || ""} readOnly disabled />
        </div>
        <div className="mb-3">
          <label className="form-label">예약자 성함</label>
          <input type="text" className="form-control" value={login?.name || ""} readOnly disabled />
        </div>
        <div className="mb-3">
          <label className="form-label">연락처</label>
          <input type="tel" className="form-control" required
            placeholder="숫자만 입력 (예: 01012345678)"
            value={resPhone} onChange={handlePhoneChange} />
          <div className="form-text">* 예약 확정 안내 문자가 전송됩니다.</div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">예약 날짜</label>
            <input type="date" className="form-control" required min={today}
              value={resDate} onChange={(e) => setResDate(e.target.value)} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">예약 시간</label>
            <input type="time" className="form-control" required
              value={resTime} onChange={(e) => setResTime(e.target.value)} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">예약 인원</label>
            <input type="number" className="form-control" required min={1} max={100}
              placeholder="인원수 입력" value={resCount} onChange={(e) => setResCount(e.target.value)} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">방문 유형</label>
            <select className="form-select" value={resType} onChange={(e) => setResType(e.target.value)}>
              <option value="단체">단체 방문</option>
              <option value="픽업">포장/픽업</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2 mt-2">
          <button type="button" className="btn-form-outline" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn-form-primary flex-grow-1" disabled={submitting}>
            {submitting ? "처리 중..." : "메뉴 선택"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReservationWriteForm;
