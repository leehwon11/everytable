import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import http from "../../api/http";
import "../store/Store.css";

// 메뉴 목록(MenuList) 위에 겹쳐 뜨는 상세보기 모달.
// NoticeViewModal과 동일한 방식으로, 목록에서 카드를 클릭했을 때만 이 컴포넌트가 쓰이고,
// 주소를 직접 입력하거나 새로고침하면 App.jsx의 background location 로직에 따라
// 이 모달 대신 MenuComp의 "view" 라우트(MenuView, 전체 화면)가 렌더링된다.
function MenuViewModal() {
  const [searchParams] = useSearchParams();
  const menuNo = searchParams.get("menuNo");
  const [menu, setMenu] = useState(null);
  const [optionGroups, setOptionGroups] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    http.get("/menu/view.do", { params: { menuNo } })
      .then((res) => setMenu(res.data))
      .catch((err) => console.error(err));
    // GroupMenuForm(주문 화면)과 동일한 옵션 조회 API. 여기서는 선택이 아니라 "확인" 목적이라
    // 어떤 옵션이 있고 필수인지, 추가금이 얼마인지만 보여준다.
    http.get("/menu/option/list.do", { params: { menuNo } })
      .then((res) => setOptionGroups(res.data || []))
      .catch((err) => console.error(err));
  }, [menuNo]);

  // 뒤로가기(모달을 열기 전 목록 상태)로 복귀 - 목록의 storeNo/manage 상태가 그대로 유지된다.
  const close = () => navigate(location.state?.backgroundLocation ?? "/menu/list", { replace: true });

  return (
    <>
      <div className="modal d-block" tabIndex={-1} role="dialog" onClick={close}>
        <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            {!menu ? (
              <div className="modal-body text-center py-5 text-muted">불러오는 중...</div>
            ) : (
              <>
                <div className="modal-header menu-view-modal">
                  <h5 className="modal-title mb-0">{menu.menuName}</h5>
                  <button type="button" className="btn-close" onClick={close}></button>
                </div>
                <div className="modal-body menu-view-modal">
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </>
  );
}

export default MenuViewModal;