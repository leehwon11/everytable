import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import http from "../../api/http";
import "./store.css";

function MyStoreList() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    http.get("/store/myStores.do")
      .then((res) => setStores(res.data || []))
      .catch((err) => {
        console.error(err);
        alert("매장 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  const imgSrc = (filename) => {
    if (!filename) return null;
    return filename.startsWith("http") ? filename : `http://localhost:80/upload/store/${filename}`;
  };

  if (loading) return <div className="text-center py-5 text-muted">불러오는 중...</div>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">내 매장 관리</h3>
        <button className="btn-store-cta primary" onClick={() => navigate("/store/write")}>
          + 매장 등록
        </button>
      </div>

      {stores.length === 0 ? (
        <p className="text-muted">등록된 매장이 없습니다. 매장을 등록해 보세요.</p>
      ) : (
        <div className="mystore-grid">
          {stores.map((s) => (
            <div className="mystore-card" key={s.storeNo} onClick={() => navigate(`/store/view?storeNo=${s.storeNo}`)}>
              <div className="mystore-card-image">
                {imgSrc(s.filename)
                  ? <img src={imgSrc(s.filename)} alt={s.storeName} />
                  : <span className="text-muted small">이미지 없음</span>}
              </div>
              <div className="mystore-card-body">
                <span className="badge bg-light text-success" style={{ width: "fit-content" }}>#{s.storeCateName}</span>
                <h5>{s.storeName}</h5>
                <p className="text-muted small mb-0">{s.storeAddr}</p>
                <p className="small mb-0">★ {s.avgRating} ({s.reviewCount})</p>
                <div className="mystore-card-actions">
                  <Link to={`/store/update?storeNo=${s.storeNo}`} onClick={(e) => e.stopPropagation()}>매장 수정</Link>
                  <Link to={`/menu/list?storeNo=${s.storeNo}&manage=1`} onClick={(e) => e.stopPropagation()}>메뉴 관리</Link>
                  <Link to={`/reservation/adminList?storeId=${s.storeNo}`} onClick={(e) => e.stopPropagation()}>주문 관리</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default MyStoreList;