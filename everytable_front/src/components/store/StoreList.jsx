import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../common/common.css";

// 원본 store/list.jsp 이식. 원본은 key(매장명/지역/카테고리)+word 검색이었지만
// 백엔드(StoreServiceImpl.list)는 word 하나로 매장명/주소/카테고리를 한꺼번에 LIKE 검색하도록
// 되어 있어 검색창도 그에 맞춰 통합 검색 한 칸으로 구성했다.
function StoreList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") || 1);
  const word = searchParams.get("word") || "";
  const [keyword, setKeyword] = useState(word);
  const [stores, setStores] = useState([]);
  const [pageObject, setPageObject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    http.get("/store/list.do", { params: { page, word: word || undefined, perPageNum: 8 } })
      .then((res) => {
        setStores(res.data.list);
        setPageObject(res.data.pageObject);
      })
      .catch((err) => console.error(err));
  }, [page, word]);

  const search = (e) => {
    e.preventDefault();
    setSearchParams(keyword ? { word: keyword } : {});
  };

  const goPage = (p) => {
    const next = { page: String(p) };
    if (word) next.word = word;
    setSearchParams(next);
  };

  const imgSrc = (filename) => {
    if (!filename) return null;
    return filename.startsWith("http") ? filename : `http://localhost:80/upload/store/${filename}`;
  };

  return (
    <>
      <h3 className="mb-3">원하는 매장을 찾아보세요</h3>

      <form className="store-search-form" onSubmit={search}>
        <input type="text" className="form-control" placeholder="매장명, 지역, 카테고리로 검색"
          value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <button className="store-search-btn">검색</button>
      </form>

      <div className="store-grid mb-4">
        {stores.map((s) => (
          <div className="store-card" key={s.storeNo} style={{ cursor: "pointer" }}
            onClick={() => navigate(`/store/view?storeNo=${s.storeNo}`)}>
            <div className="store-card-image">
              {imgSrc(s.filename)
                ? <img src={imgSrc(s.filename)} alt={s.storeName} />
                : <span className="no-image">이미지 없음</span>}
            </div>
            <div className="tag-row">
              <span className="tag">#{s.storeCateName}</span>
              <span className="rating">{s.avgRating} <span className="text-muted small">({s.reviewCount})</span></span>
            </div>
            <h5>{s.storeName}</h5>
            <p className="addr">{s.storeAddr}</p>
          </div>
        ))}
        {stores.length === 0 && <p className="text-muted">등록된 매장이 없습니다.</p>}
      </div>

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
    </>
  );
}

export default StoreList;