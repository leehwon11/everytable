import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/store.css";

function ReviewUpdateForm() {
  const [searchParams] = useSearchParams();
  const no = searchParams.get("no");
  const storeId = searchParams.get("storeId");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    http.get("/review/view.do", { params: { no } })
      .then((res) => {
        setContent(res.data.content || "");
        setRating(Number(res.data.rating) || 5);  // toFixed() 제거, Number()로 안전하게 변환
      })
      .catch((err) => console.error(err));
  }, [no]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await http.post("/review/update.do", { no: Number(no), content, rating });
      navigate(storeId ? `/review/storeList?storeId=${storeId}` : "/review/list");
    } catch (err) {
      alert(err.response?.data?.message || "수정에 실패했습니다.");
    }
  };

  const LABELS = { 1: "최악이에요", 2: "별로예요", 3: "보통이에요", 4: "좋아요", 5: "최고예요" };

  return (
    <div className="form-card" style={{ maxWidth: 560 }}>
      <h4 className="text-center">리뷰 수정</h4>
      <p className="text-center form-subtitle">작성하신 리뷰 내용을 수정할 수 있습니다.</p>
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
        <div className="mb-4">
          <label className="form-label">내용</label>
          <textarea className="form-control" rows={6} required placeholder="솔직한 리뷰를 작성해주세요!"
            value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn-form-outline" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn-form-primary flex-grow-1">수정 완료</button>
        </div>
      </form>
    </div>
  );
}

export default ReviewUpdateForm;