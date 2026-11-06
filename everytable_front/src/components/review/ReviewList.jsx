import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import "../store/store.css";

function ReviewList() {
  const [list, setList] = useState([]);
  const navigate = useNavigate();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();

  const load = () => {
    http.get("/review/list.do")
      .then((res) => setList(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(load, []);

  const remove = async (no) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await http.post("/review/delete.do", { no });
      load();
    } catch (err) {
      console.error(err);
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <h4 className="fw-bold mb-4">총 {list.length}개의 리뷰</h4>

      {list.length === 0 && <div className="review-empty">작성한 리뷰가 없습니다.</div>}

      {list.map((vo) => (
        <div key={vo.reviewNo} className="review-card">
          {login?.no === vo.userNo && (
            <div className="review-actions">
              <button className="btn btn-sm btn-outline-secondary"
                onClick={() => navigate(`/review/updateForm?no=${vo.reviewNo}`)}>수정</button>
              <button className="btn btn-sm btn-outline-danger"
                onClick={() => remove(vo.reviewNo)}>삭제</button>
            </div>
          )}
          <div className="review-head">
            <div className="review-avatar">{vo.userName?.[0]?.toUpperCase()}</div>
            <div>
              <div>
                <span className="review-name">{vo.userName}님</span>
                <span className="review-stars">{"★".repeat(vo.rating)}</span>
              </div>
              <div className="review-date">{vo.createdAt}</div>
            </div>
          </div>
          <div className="review-content">{vo.content}</div>
          <span className="review-store-tag">매장 이름: {vo.storeName}</span>
        </div>
      ))}
    </>
  );
}

export default ReviewList;