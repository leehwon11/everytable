import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/store.css";

function ReviewStoreList() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("storeId");
  const storeName = searchParams.get("storeName");
  const [list, setList] = useState([]);
  const navigate = useNavigate();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();

  const load = () => {
    http.get("/review/storeList.do", { params: { storeId } })
      .then((res) => setList(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(load, [storeId]);

  const remove = async (no) => {
    if (!confirm("삭제하시겠습니까?")) return;
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
      <h3 className="fw-bold mb-1">{storeName ? `${storeName} 리뷰` : "매장 리뷰"} <small className="text-muted">(총 {list.length}개)</small></h3>
      <hr />

      {list.length === 0 && (
        <div className="review-empty">
          아직 작성된 리뷰가 없습니다.<br />첫 번째 리뷰의 주인공이 되어보세요!
        </div>
      )}

      {list.map((vo) => (
        <div key={vo.reviewNo} className="review-card">
          {login?.no === vo.userNo && (
            <div className="review-actions">
              <button className="btn btn-sm btn-outline-secondary"
                onClick={() => navigate(`/review/updateForm?no=${vo.reviewNo}&storeId=${storeId}`)}>수정</button>
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
        </div>
      ))}

      <div className="text-center mt-5 mb-3">
        <button type="button" className="btn-form-outline px-4" onClick={() => navigate(-1)}>뒤로가기</button>
      </div>
    </>
  );
}

export default ReviewStoreList;