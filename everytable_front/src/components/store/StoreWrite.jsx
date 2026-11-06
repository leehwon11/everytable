import { useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import "./store.css";

function StoreWrite() {
  const [storeName, setStoreName] = useState("");
  const [storeCateNo, setStoreCateNo] = useState("");
  const [storeAddr, setStoreAddr] = useState("");
  const [storeTel, setStoreTel] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [minOrderPrice, setMinOrderPrice] = useState(200000);
  const [prepareTime, setPrepareTime] = useState("");
  const [refundPolicy24, setRefundPolicy24] = useState("100% 환불");
  const [refundPolicy12, setRefundPolicy12] = useState("50% 환불");
  const [refundPolicy0, setRefundPolicy0] = useState("환불 불가");
  const [filename, setFilename] = useState("");
  const navigate = useNavigate();
  const CATEGORIES = [
    { no: 1, name: "한식" },
    { no: 2, name: "일식" },
    { no: 3, name: "중식" },
    { no: 4, name: "양식" },
    { no: 5, name: "카페" },
    { no: 6, name: "기타" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storeCateNo) { alert("카테고리를 선택해 주세요."); return; }
    try {
      const res = await http.post("/store/write.do", {
        storeName, storeCateNo: Number(storeCateNo), storeAddr, storeTel, openTime,
        minOrderPrice: Number(minOrderPrice) || 0,
        prepareTime, refundPolicy24, refundPolicy12, refundPolicy0,
        filename: filename || null,
      });
      alert("매장이 등록되었습니다. 이제 메뉴를 등록해 보세요.");
      navigate(`/store/view?storeNo=${res.data.storeNo}`, { replace: true });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "매장 등록에 실패했습니다.");
    }
  };

  return (
    <div className="form-card">
      <div className="form-intro">
        <h5 className="mb-1">🏪 에브리테이블에 오신 것을 환영합니다!</h5>
        <p className="mb-0 small text-muted">매장을 등록하고 단체 주문 서비스를 시작해보세요. (정보 입력 → 메뉴 등록 → 주문 관리)</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section-label">기본 정보</div>
        <div className="mb-3">
          <label className="form-label">매장명 *</label>
          <input type="text" className="form-control" required maxLength={50}
            placeholder="예: 한강뷰 레스토랑" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">카테고리 *</label>
          <select className="form-select" value={storeCateNo} onChange={(e) => setStoreCateNo(e.target.value)} required>
            <option value="">선택하세요</option>
            {CATEGORIES.map((c) => <option key={c.no} value={c.no}>{c.name}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">매장 주소 *</label>
          <input type="text" className="form-control" required
            placeholder="예: 서울시 마포구 와우산로 94" value={storeAddr} onChange={(e) => setStoreAddr(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">전화번호</label>
          <input type="text" className="form-control" placeholder="예: 02-1234-5678"
            value={storeTel} onChange={(e) => setStoreTel(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">대표 이미지 URL (선택)</label>
          <input type="text" className="form-control" placeholder="https://..."
            value={filename} onChange={(e) => setFilename(e.target.value)} />
          {filename.trim() && (
            <img src={filename} alt="미리보기" className="img-fluid mt-2 rounded" style={{ maxHeight: 200 }} />
          )}
        </div>

        <div className="form-section-label">운영 정보</div>
        <div className="mb-3">
          <label className="form-label">영업시간</label>
          <input type="text" className="form-control" placeholder="10:00 - 22:00"
            value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
        </div>
        <div className="row mb-3">
          <div className="col-6">
            <label className="form-label">최소 주문금액 (원)</label>
            <input type="number" className="form-control" value={minOrderPrice}
              onChange={(e) => setMinOrderPrice(e.target.value)} />
          </div>
          <div className="col-6">
            <label className="form-label">기본 준비시간 (시간)</label>
            <input type="text" className="form-control" placeholder="4"
              value={prepareTime} onChange={(e) => setPrepareTime(e.target.value)} />
          </div>
        </div>

        <div className="form-section-label">환불 정책 설정</div>
        <div className="row mb-3">
          <div className="col-4">
            <label className="form-label small">24시간 전</label>
            <input type="text" className="form-control" value={refundPolicy24} onChange={(e) => setRefundPolicy24(e.target.value)} />
          </div>
          <div className="col-4">
            <label className="form-label small">12시간 전</label>
            <input type="text" className="form-control" value={refundPolicy12} onChange={(e) => setRefundPolicy12(e.target.value)} />
          </div>
          <div className="col-4">
            <label className="form-label small">당일</label>
            <input type="text" className="form-control" value={refundPolicy0} onChange={(e) => setRefundPolicy0(e.target.value)} />
          </div>
        </div>

        <div className="d-flex gap-2 mt-2">
          <button type="button" className="btn-form-outline" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn-form-primary flex-grow-1">🏪 매장 등록하기</button>
        </div>
      </form>
    </div>
  );
}

export default StoreWrite;