import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/Store.css";

function MenuList() {
  const [searchParams] = useSearchParams();
  const storeNo = searchParams.get("storeNo");
  const [menus, setMenus] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();
  const isOwnerView = login?.gradeNo === 2 && searchParams.get("manage") === "1";

  useEffect(() => {
    if (!storeNo) {
      navigate(login?.gradeNo === 2 ? "/store/myList" : "/store/list");
      return;
    }
    const url = isOwnerView ? "/menu/listAll.do" : "/menu/list.do";
    http.get(url, { params: { storeNo } })
      .then((res) => setMenus(res.data))
      .catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeNo]);

  // 메뉴 카드를 클릭하면 상세보기 모달을 연다. 현재 목록 화면(storeNo/manage 상태 포함)을
  // backgroundLocation으로 넘겨서, 모달을 닫거나 뒤로가기 했을 때 그대로 복귀할 수 있게 한다.
  const openView = (menuNo) => {
    navigate(`/menu/view?menuNo=${menuNo}`, { state: { backgroundLocation: location } });
  };

  const changeStatus = async (menuNo, isActive) => {
    try {
      await http.post("/menu/changeStatus.do", { menuNo, isActive: isActive ? 0 : 1 });
      setMenus((prev) => prev.map((m) => (m.menuNo === menuNo ? { ...m, isActive: isActive ? 0 : 1 } : m)));
    } catch (err) {
      console.error(err);
      alert("상태 변경에 실패했습니다.");
    }
  };

  const remove = async (menuNo) => {
    if (!confirm("이 메뉴를 삭제하시겠습니까?")) return;
    try {
      await http.post("/menu/delete.do", { menuNo });
      setMenus((prev) => prev.filter((m) => m.menuNo !== menuNo));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">메뉴 {isOwnerView ? "관리" : "목록"}</h3>
        {isOwnerView && storeNo && (
          <Link to={`/menu/write?storeNo=${storeNo}`} className="btn-store-cta primary">
            + 메뉴 추가
          </Link>
        )}
      </div>

      {menus.length === 0 ? (
        <p className="text-muted">등록된 메뉴가 없습니다.</p>
      ) : (
        <div className="menu-grid">
          {menus.map((m) => (
            <div
              className="menu-card"
              key={m.menuNo}
              style={isOwnerView ? { cursor: "default" } : undefined}
              // 점주 관리 모드(isOwnerView)에서는 카드 클릭 시 상세보기를 띄우지 않는다.
              // 판매중/품절 전환, 수정, 삭제는 아래 버튼으로만 하도록 한다.
              {...(!isOwnerView && {
                role: "button",
                tabIndex: 0,
                onClick: () => openView(m.menuNo),
                onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && openView(m.menuNo),
              })}>
              <div className="menu-card-image">
                {m.imageUrl
                  ? <img src={m.imageUrl} alt={m.menuName} />
                  : <span className="no-image">이미지 없음</span>}
              </div>
              <div className="menu-card-body">
                <h6>{m.menuName}</h6>
                <p className="desc">{m.description}</p>
                <p className="price">{m.price.toLocaleString()}원</p>

                {isOwnerView && (
                  <div className="menu-status-row">
                    <button
                      className={"btn btn-sm " + (m.isActive === 1 ? "btn-success" : "btn-secondary")}
                      onClick={() => changeStatus(m.menuNo, m.isActive)}>
                      {m.isActive === 1 ? "판매중" : "품절"}
                    </button>
                  </div>
                )}
                {isOwnerView && (
                  <div className="menu-actions">
                    <Link to={`/menu/update?menuNo=${m.menuNo}`}>수정</Link>
                    <button onClick={() => remove(m.menuNo)}>삭제</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button type="button" className="btn-store-cta outline small mt-3" onClick={() => navigate(-1)}>
        돌아가기
      </button>
    </>
  );
}

export default MenuList;