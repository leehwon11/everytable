import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "./store.css";

function StoreUpdate() {
  const [searchParams] = useSearchParams();
  const storeNo = searchParams.get("storeNo");
  const [vo, setVo] = useState(null);
  const navigate = useNavigate();
  const CATEGORIES = [
    { no: 1, name: "한식" },
    { no: 2, name: "일식" },
    { no: 3, name: "중식" },
    { no: 4, name: "양식" },
    { no: 5, name: "카페" },
    { no: 6, name: "기타" },
  ];

  useEffect(() => {
    if (!storeNo) {
      navigate("/store/myList");
      return;
    }
    http.get("/store/view.do", { params: { storeId: storeNo } })
      .then((res) => setVo(res.data))
      .catch((err) => {
        console.error(err);
        alert("매장 정보를 불러오지 못했습니다.");
        navigate("/store/myList");
      });
  }, [storeNo, navigate]);

  const set = (field, value) => setVo((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await http.post("/store/update.do", vo);
      if (res.data.result === "ok") {
        alert("매장 정보가 수정되었습니다.");
        navigate(`/store/view?storeNo=${vo.storeNo}`, { replace: true });
      } else {
        alert(res.data.message || "수정에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "수정 중 오류가 발생했습니다.");
    }
  };

  if (!vo) return null;

  return (
    <div className="form-card">
      <h4>매장 정보 수정</h4>
      <p className="form-subtitle">{vo.storeName}</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">매장명 *</label>
          <input type="text" className="form-control" required
            value={vo.storeName || ""} onChange={(e) => set("storeName", e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">카테고리 *</label>
          <select className="form-select" value={vo.storeCateNo || ""} onChange={(e) => set("storeCateNo", Number(e.target.value))} required>
            <option value="">선택하세요</option>
            {CATEGORIES.map((c) => <option key={c.no} value={c.no}>{c.name}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">매장 주소 *</label>
          <input type="text" className="form-control" required
            value={vo.storeAddr || ""} onChange={(e) => set("storeAddr", e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">전화번호</label>
          <input type="text" className="form-control"
            value={vo.storeTel || ""} onChange={(e) => set("storeTel", e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">대표 이미지 URL</label>
          <input type="text" className="form-control" placeholder="https://..."
            value={vo.filename || ""} onChange={(e) => set("filename", e.target.value)} />
          {vo.filename && vo.filename.trim() && (
            <img src={vo.filename} alt="미리보기" className="img-fluid mt-2 rounded" style={{ maxHeight: 200 }} />
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">영업시간</label>
          <input type="text" className="form-control"
            value={vo.openTime || ""} onChange={(e) => set("openTime", e.target.value)} />
        </div>
        <div className="row mb-3">
          <div className="col-6">
            <label className="form-label">최소 주문금액 (원)</label>
            <input type="number" className="form-control"
              value={vo.minOrderPrice || 0} onChange={(e) => set("minOrderPrice", Number(e.target.value))} />
          </div>
          <div className="col-6">
            <label className="form-label">기본 준비시간 (시간)</label>
            <input type="text" className="form-control"
              value={vo.prepareTime || ""} onChange={(e) => set("prepareTime", e.target.value)} />
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-4">
            <label className="form-label small">24시간 전 환불</label>
            <input type="text" className="form-control" value={vo.refundPolicy24 || ""} onChange={(e) => set("refundPolicy24", e.target.value)} />
          </div>
          <div className="col-4">
            <label className="form-label small">12시간 전 환불</label>
            <input type="text" className="form-control" value={vo.refundPolicy12 || ""} onChange={(e) => set("refundPolicy12", e.target.value)} />
          </div>
          <div className="col-4">
            <label className="form-label small">당일 환불</label>
            <input type="text" className="form-control" value={vo.refundPolicy0 || ""} onChange={(e) => set("refundPolicy0", e.target.value)} />
          </div>
        </div>
        <div className="d-flex gap-2 mt-2">
          <button type="button" className="btn-form-outline" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn-form-primary flex-grow-1">수정 완료</button>
        </div>
      </form>
    </div>
  );
}

export default StoreUpdate;