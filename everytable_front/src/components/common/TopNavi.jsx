import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import "./common.css";

function TopNavi() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [login, setLogin] = useState(() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  });
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("viewMode") || "customer");
  const navigate = useNavigate();
  const location = useLocation();

  // 로그인/로그아웃 시 localStorage가 바뀌면 네비 상태도 즉시 동기화
  useEffect(() => {
    const syncAuth = () => {
      const t = localStorage.getItem("token");
      const data = localStorage.getItem("login");
      setToken(t);
      setLogin(data ? JSON.parse(data) : null);
    };
    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-change", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-change", syncAuth);
    };
  }, []);

  // 점주가 아닌데 owner 모드로 남아있는 경우 방지 (로그아웃 후 다른 계정 로그인 등)
  useEffect(() => {
    if (login?.gradeNo !== 2 && viewMode !== "customer") {
      setViewMode("customer");
      localStorage.setItem("viewMode", "customer");
    }
  }, [login, viewMode]);

  const logout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("login");
    localStorage.removeItem("viewMode");
    setToken(null);
    setLogin(null);
    window.dispatchEvent(new Event("auth-change"));
    alert("로그아웃 되었습니다.");
    navigate("/");
  };

  const toggleMode = () => {
    const next = viewMode === "owner" ? "customer" : "owner";
    setViewMode(next);
    localStorage.setItem("viewMode", next);
    navigate(next === "owner" ? "/store/myList" : "/");
  };

  const isOwner = token && login?.gradeNo === 2;
  const showOwnerNav = isOwner && viewMode === "owner";

  return (
    <nav className="navbar navbar-expand-sm navbar-dark fixed-top top-navi">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C7 2 4 6 4 10.5C4 15 7.5 18 12 22C16.5 18 20 15 20 10.5C20 6 17 2 12 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M12 6.5V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M12 9.5C10.5 9.5 9 10.2 8.2 11.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M12 13.5C13.5 13.5 15 14.2 15.8 15.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          everytable
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mynavbar">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mynavbar">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink to="/notice/list" className="nav-link">공지사항</NavLink>
            </li>

            {!showOwnerNav && (
              <>
                <li className="nav-item">
                  <NavLink to="/store/list" className="nav-link">매장 찾기</NavLink>
                </li>
                {token && login?.gradeNo === 9 && (
                  <li className="nav-item">
                    <NavLink to="/reservation/adminList" className="nav-link">주문 관리</NavLink>
                  </li>
                )}
                {token && login?.gradeNo !== 9 && (
                  <li className="nav-item">
                    <NavLink to="/reservation/list" className="nav-link">예약 내역</NavLink>
                  </li>
                )}
                {token && (
                  <li className="nav-item">
                    <NavLink to="/payment/list" className="nav-link">결제 내역</NavLink>
                  </li>
                )}
                {token && login?.gradeNo === 9 && (
                  <li className="nav-item">
                    <NavLink to="/stats/dashboard" className="nav-link">매출 통계</NavLink>
                  </li>
                )}
                {token && login?.gradeNo !== 9 && (
                  <li className="nav-item">
                    <NavLink to="/review/list" className="nav-link">리뷰 내역</NavLink>
                  </li>
                )}
              </>
            )}

            {showOwnerNav && (
              <>
                <li className="nav-item">
                  <NavLink to="/store/myList" className="nav-link">매장 관리</NavLink>
                </li>
                <li className="nav-item">
                  <Link to="/reservation/adminList"
                    className={"nav-link" + (location.pathname === "/reservation/adminList" && !location.search ? " active" : "")}>
                    주문 관리
                  </Link>
                </li>
                <li className="nav-item">
                  <NavLink to="/stats/dashboard" className="nav-link">매출 통계</NavLink>
                </li>
              </>
            )}

            {/* 관리자(9) 전용 메뉴 */}
            {token && login?.gradeNo === 9 && (
              <li className="nav-item">
                <NavLink to="/member/list" className="nav-link">회원관리</NavLink>
              </li>
            )}
          </ul>
          <ul className="navbar-nav ms-auto align-items-sm-center">
            {isOwner && (
              <li className="nav-item me-2">
                <button type="button" className="nav-mode-toggle" onClick={toggleMode}>
                  {showOwnerNav ? "일반 모드로 전환" : "점주 모드로 전환"}
                </button>
              </li>
            )}
            {!token && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/member/login">로그인</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link nav-cta" to="/member/write">회원가입</Link>
                </li>
              </>
            )}
            {token && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/member/view">{login?.name}님</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/member/logout" onClick={logout}>로그아웃</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default TopNavi;