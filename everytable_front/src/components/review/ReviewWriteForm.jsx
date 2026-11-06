import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/store.css";

function ReviewWriteForm() {
  const [searchParams] = useSearchParams();
  const resNo = searchParams.get("resNo");
  const storeName = searchParams.get("storeName");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await http.post("/review/write.do", { resNo: Number(resNo), rating, content });
      navigate("/reservation/list");
    } catch (err) {
      alert(err.response?.data?.message || "리뷰 등록에 실패했습니다.");
    }
  };

  const LABELS = { 1: "최악이에요", 2: "별로예요", 3: "보통이에요", 4: "좋아요", 5: "최고예요" };

  return (
    <div className="form-card" style={{ maxWidth: 560 }}>
      <h4 className="text-center">리뷰 작성하기</h4>
      {storeName && <p className="text-center form-subtitle">{storeName}</p>}
      <form onSubmit={handleSubmit}>
        <div className="text-center mb-4">
          <label className="text-muted d-block mb-2">별점을 선택해주세요</label>
          <div style={{ fontSize: "2.4rem", lineHeight: 1 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n}
                style={{ cursor: "pointer", color: n <= (hover || rating) ? "#E8A93B" : "#ddd", transition: "color 0.1s" }}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}>★</span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "#E8A93B", marginTop: 6, fontWeight: 600 }}>
            {LABELS[hover || rating]}
          </div>
        </div>
        <textarea className="form-control mb-4" rows={8} required placeholder="음식의 맛과 서비스는 어떠셨나요?"
          value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="d-flex gap-2">
          <button type="button" className="btn-form-outline" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn-form-primary flex-grow-1">리뷰 등록하기</button>
        </div>
      </form>
    </div>
  );
}

export default ReviewWriteForm;