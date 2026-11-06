import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/Store.css";

// /menu/view?menuNo=... 주소로 직접 들어오거나 새로고침했을 때 보여지는 전체 화면 버전.
// 목록에서 카드를 클릭했을 때는 MenuViewModal(모달)이 대신 렌더링된다. (App.jsx 참고)
function MenuView() {
  const [searchParams] = useSearchParams();
  const menuNo = searchParams.get("menuNo");
  const [menu, setMenu] = useState(null);
  const [optionGroups, setOptionGroups] = useState([]);

  useEffect(() => {
    http.get("/menu/view.do", { params: { menuNo } })
      .then((res) => setMenu(res.data))
      .catch((err) => console.error(err));
    http.get("/menu/option/list.do", { params: { menuNo } })
      .then((res) => setOptionGroups(res.data || []))
      .catch((err) => console.error(err));
  }, [menuNo]);

  if (!menu) return null;

  return (
    <div className="menu-view-card">
      <h3>{menu.menuName}</h3>

      {menu.imageUrl
        ? <img src={menu.imageUrl} alt={menu.menuName} className="menu-view-image" />
        : <div className="menu-view-image no-image">이미지 없음</div>}

      <p className="price">{menu.price.toLocaleString()}원</p>
      <p className="menu-view-desc">
        {menu.description || "등록된 설명이 없습니다."}
      </p>

      {menu.isActive !== 1 && (
        <span className="menu-view-soldout">현재 품절된 메뉴입니다.</span>
      )}

      {optionGroups.length > 0 && (
        <div className="menu-view-options">
          <div className="menu-view-options-title">선택 가능한 옵션</div>
          {optionGroups.map((g) => (
            <div key={g.optionName} className="menu-view-option-group">
              <div className="menu-view-option-name">
                {g.optionName}
                {g.isRequired === 1 && <span className="req">필수</span>}
              </div>
              <div className="menu-view-option-values">
                {g.values.map((v) => (
                  <span key={v.optionValue} className="menu-view-option-chip">
                    {v.optionValue}
                    {v.additionalPrice > 0 && ` (+${v.additionalPrice.toLocaleString()}원)`}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="menu-view-actions">
        <Link to={`/menu/list?storeNo=${menu.storeNo}`} className="btn-store-cta outline">목록</Link>
      </div>
    </div>
  );
}

export default MenuView;