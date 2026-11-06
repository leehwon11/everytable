import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "./store.css";

// 원본 store/view.jsp 이식 (매장 상세 + 메뉴 목록 + 환불 정책 표시).
function StoreView() {
  const [searchParams] = useSearchParams();
  const storeNo = searchParams.get("storeNo");
  const [vo, setVo] = useState(null);
  const [menuList, setMenuList] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();

  useEffect(() => {
    if (!storeNo) { navigate("/store/list"); return; }
    http.get("/store/view.do", { params: { storeId: storeNo } })
      .then((res) => setVo(res.data))
      .catch((err) => { console.error(err); alert("매장 정보를 불러오지 못했습니다."); });
    http.get("/menu/list.do", { params: { storeNo } })
      .then((res) => setMenuList(res.data))
      .catch((err) => console.error(err));
  }, [storeNo, navigate]);

  // 메뉴 카드를 클릭하면 MenuList와 동일한 메뉴 상세보기 모달(MenuViewModal)을 연다.
  // 현재 매장 상세 화면을 backgroundLocation으로 넘겨서, 모달을 닫으면 그대로 이 화면으로 복귀한다.
  const openMenuView = (menuNo) => {
    navigate(`/menu/view?menuNo=${menuNo}`, { state: { backgroundLocation: location } });
  };

  const imgSrc = (filename) => {
    if (!filename) return null;
    return filename.startsWith("http") ? filename : `http://localhost:8080/upload/store/${filename}`;
  };

  if (!vo) return null;

  const isOwner = login && login.gradeNo === 2 && login.no === vo.ownerNo;
  const isAdmin = login?.gradeNo === 9;

  return (
    <div>
      <div className="store-hero">
        <div className="store-hero-image">
          {imgSrc(vo.filename)
            ? <img src={imgSrc(vo.filename)} alt={vo.storeName} />
            : <span className="no-image">이미지 없음</span>}
        </div>
        <div className="store-hero-info">
          <span className="badge bg-light text-success" style={{ width: "fit-content" }}>#{vo.storeCateName}</span>
          <h2>{vo.storeName}</h2>
          <p className="addr">{vo.storeAddr}</p>
          <p>
            ★ {vo.avgRating}{" "}
            <Link to={`/review/storeList?storeId=${vo.storeNo}`} className="rating-link">
              ({vo.reviewCount} 리뷰)
            </Link>
          </p>
          <p className="tel">📞 {vo.storeTel}</p>

          <div className="store-hero-stats">
            <div>
              <div className="stat-label">영업시간</div>
              <div className="stat-value">{vo.openTime}</div>
            </div>
            <div>
              <div className="stat-label">최소 주문금액</div>
              <div className="stat-value">{vo.minOrderPrice?.toLocaleString()}원</div>
            </div>
            <div>
              <div className="stat-label">준비시간</div>
              <div className="stat-value">{vo.prepareTime}</div>
            </div>
          </div>

          <div className="store-hero-actions">
            {!isOwner && !isAdmin && (
              <Link to={`/reservation/writeForm?storeId=${vo.storeNo}`} className="btn-store-cta primary">
                예약하기
              </Link>
            )}
            {isOwner && (
              <Link to={`/store/update?storeNo=${vo.storeNo}`} className="btn-store-cta outline">
                매장 정보 수정
              </Link>
            )}
          </div>
        </div>
      </div>

      <h5 className="section-title">메뉴</h5>
      <div className="menu-grid">
        {menuList.map((m) => (
          <div
            className="menu-card"
            key={m.menuNo}
            role="button"
            tabIndex={0}
            onClick={() => openMenuView(m.menuNo)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openMenuView(m.menuNo)}>
            <div className="menu-card-image">
              {m.imageUrl
                ? <img src={m.imageUrl} alt={m.menuName} />
                : <span className="no-image">이미지 없음</span>}
            </div>
            <div className="menu-card-body">
              <h6>{m.menuName}</h6>
              <p className="desc">{m.description}</p>
              <p className="price">{m.price?.toLocaleString()}원</p>
            </div>
          </div>
        ))}
        {menuList.length === 0 && <p className="text-muted">등록된 메뉴가 없습니다.</p>}
      </div>

      <h5 className="section-title">환불 정책</h5>
      <div className="refund-grid">
        <div className="refund-card">
          <div className="label">24시간 전</div>
          <div className="value">{vo.refundPolicy24}</div>
        </div>
        <div className="refund-card">
          <div className="label">12시간 전</div>
          <div className="value">{vo.refundPolicy12}</div>
        </div>
        <div className="refund-card">
          <div className="label">당일</div>
          <div className="value">{vo.refundPolicy0}</div>
        </div>
      </div>
      
      <button type="button" className="btn-store-cta outline small mt-3" onClick={() => navigate(-1)}>
        돌아가기
      </button>
    </div>
  );
}

export default StoreView;