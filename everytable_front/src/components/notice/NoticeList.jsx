import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "./notice.css";

// 원본 notice/list.jsp 의 카테고리 필터 버튼(전체/공지사항/시스템/이벤트/업데이트)을 그대로 이식.
// cate_no: 1=공지사항, 2=시스템, 3=이벤트, 4=업데이트 (원본 list.jsp에 하드코딩된 값)
const CATEGORIES = [
  { key: "", label: "전체" },
  { key: "1", label: "공지사항" },
  { key: "2", label: "시스템" },
  { key: "3", label: "이벤트" },
  { key: "4", label: "업데이트" },
];

function NoticeList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") || 1);
  const key = searchParams.get("key") || "";
  const [notices, setNotices] = useState([]);
  const [pageObject, setPageObject] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();
  const isAdmin = login?.gradeNo === 9;

  useEffect(() => {
    http.get("/notice/list.do", { params: { page, key: key || undefined } })
      .then((res) => {
        setNotices(res.data.list);
        setPageObject(res.data.pageObject);
      })
      .catch((err) => console.error(err));
  }, [page, key]);

  const changeCategory = (catKey) => {
    setSearchParams(catKey ? { key: catKey } : {});
  };

  const goPage = (p) => {
    const next = { page: String(p) };
    if (key) next.key = key;
    setSearchParams(next);
  };

  return (
    <>
      <h3 className="mb-3">공지사항</h3>

      <div className="notice-cate-group mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            className={"notice-cate-btn" + (key === c.key ? " active" : "")}
            onClick={() => changeCategory(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {notices.length === 0 ? (
        <div className="notice-empty">등록된 공지가 없습니다.</div>
      ) : (
        notices.map((n) => (
          <div key={n.noticeNo} className="notice-list-card"
            onClick={() => navigate(`/notice/view?no=${n.noticeNo}`, { state: { backgroundLocation: location } })}>
            <div className="notice-list-main">
              <span className="notice-cate-tag">{n.cateName}</span>
              <span className="notice-list-title">{n.title}</span>
            </div>
            <div className="notice-list-meta">
              <span className="writer">{n.writerName}</span>
              <span>{n.writeDate}</span>
              <span>조회 {n.hit}</span>
            </div>
          </div>
        ))
      )}

      {pageObject && pageObject.totalPage > 1 && (
        <nav className="mt-3">
          <ul className="pagination justify-content-center">
            <li className={"page-item" + (page === 1 ? " disabled" : "")}>
              <button className="page-link" disabled={page === 1}
                onClick={() => goPage(1)}>&laquo;</button>
            </li>
            <li className={"page-item" + (pageObject.startPage === 1 ? " disabled" : "")}>
              <button className="page-link" disabled={pageObject.startPage === 1}
                onClick={() => goPage(pageObject.startPage - 1)}>&lt;</button>
            </li>
            {Array.from(
              { length: pageObject.endPage - pageObject.startPage + 1 },
              (_, i) => pageObject.startPage + i
            ).map((p) => (
              <li key={p} className={"page-item " + (p === page ? "active" : "")}>
                <button className="page-link" onClick={() => goPage(p)}>{p}</button>
              </li>
            ))}
            <li className={"page-item" + (pageObject.endPage === pageObject.totalPage ? " disabled" : "")}>
              <button className="page-link" disabled={pageObject.endPage === pageObject.totalPage}
                onClick={() => goPage(pageObject.endPage + 1)}>&gt;</button>
            </li>
            <li className={"page-item" + (page === pageObject.totalPage ? " disabled" : "")}>
              <button className="page-link" disabled={page === pageObject.totalPage}
                onClick={() => goPage(pageObject.totalPage)}>&raquo;</button>
            </li>
          </ul>
        </nav>
      )}

      {isAdmin && (
        <Link to="/notice/write" className="notice-write-btn">공지 등록</Link>
      )}
    </>
  );
}

export default NoticeList;
