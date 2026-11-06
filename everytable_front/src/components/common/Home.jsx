import { useEffect, useState } from "react";
import http from "../../api/http";
import { Link } from "react-router-dom";
import "./common.css";

function Home() {
  const [stores, setStores] = useState([]);

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();

  useEffect(() => {
    http.get("/main/main.do")
      .then((res) => {
        const list = res.data?.stores?.list ?? [];
        setStores(list);
      })
      .catch((err) => console.error("메인 데이터 조회 실패:", err));
  }, []);

  return (
    <>
      <div className="home-intro">
        <span className="home-eyebrow">EVERYTABLE</span>
        <h1>단체 손님도, 각자 다른 메뉴도 문제없이.</h1>
        <p>
          모임 인원이 각자 자기가 먹고 싶은 메뉴를 직접 골라 담고, 한 번에 예약·주문할 수 있는
          단체 손님 전용 예약 서비스입니다. 메뉴 취향이 다 달라도 한 자리에서 간편하게 해결하세요.
        </p>
      </div>

      <div className="home-section-head">
        <h2>이번달 인기 매장 Top8</h2>
        <span>주문 많은 순</span>
      </div>

      {stores.length === 0 && <p className="text-muted">이번달 등록된 주문이 아직 없습니다.</p>}

      <div className="store-grid">
        {stores.map((s, i) => {
          const isOwnStore = login && login.gradeNo === 2 && login.no === s.ownerNo;
          const isAdmin = login?.gradeNo === 9;
          return (
            <div className="store-card" key={s.storeNo}>
              <div className="tag-row">
                <span className="tag">{s.storeCateName}</span>
                <span className="rating">{s.avgRating?.toFixed?.(1) ?? s.avgRating}</span>
              </div>
              <h5>{i + 1}. {s.storeName}</h5>
              <p className="addr">{s.storeAddr}</p>
              <div className="store-actions">
                <Link to={`/menu/list?storeNo=${s.storeNo}`} className="store-btn">
                  메뉴 보기
                </Link>
                {!isOwnStore && !isAdmin && (
                  <Link to={`/reservation/writeForm?storeId=${s.storeNo}`} className="store-btn store-btn-primary">
                    예약하기
                  </Link>
                )}
                <Link to={`/review/storeList?storeId=${s.storeNo}`} className="store-btn">
                  리뷰 보기
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Home;