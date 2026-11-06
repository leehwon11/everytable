import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "./stats.css";

// 원본 stats/sales_period.jsp 이식 - 기간별 매출 조회 + 관리자 전체 매장 통계 지원
function StatsSalesPeriod() {
  const [searchParams, setSearchParams] = useSearchParams();
  const storeNo = searchParams.get("storeNo") || "";
  const storeCateNo = searchParams.get("storeCateNo") || "";
  const region = searchParams.get("region") || "";
  const [stores, setStores] = useState([]);
  const [storeSearch, setStoreSearch] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [regionInput, setRegionInput] = useState(region);
  const page = Number(searchParams.get("page") || 1);
  const [list, setList] = useState([]);
  const [totalSum, setTotalSum] = useState(0);
  const [pageObject, setPageObject] = useState(null);
  const navigate = useNavigate();
  const CATEGORIES = [
    { no: 1, name: "한식" },
    { no: 2, name: "일식" },
    { no: 3, name: "중식" },
    { no: 4, name: "양식" },
    { no: 5, name: "카페" },
    { no: 6, name: "기타" },
  ];

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();
  const isAdmin = login?.gradeNo === 9;

  const load = () => {
    http.get("/stats/sales.do", {
      params: {
        storeNo: storeNo || undefined,
        storeCateNo: isAdmin ? (storeCateNo || undefined) : undefined,
        region: isAdmin ? (region || undefined) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
      },
    })
      .then((res) => {
        setList(res.data.list);
        setTotalSum(res.data.totalSum);
        setPageObject(res.data.pageObject);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    http.get("/store/myStores.do")
      .then((res) => setStores(res.data || []))
      .catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeNo, storeCateNo, region, page]);

  const selectStore = (s) => {
    setStoreSearch(s ? s.storeName : "");
    setShowSuggest(false);
    setSearchParams({ storeNo: s ? s.storeNo : "", storeCateNo, region, startDate, endDate, page: "1" });
  };

  useEffect(() => {
    if (!storeNo) { setStoreSearch(""); return; }
    const s = stores.find((st) => String(st.storeNo) === String(storeNo));
    if (s) setStoreSearch(s.storeName);
  }, [storeNo, stores]);

  const changeCate = (e) => {
    setSearchParams({ storeNo, storeCateNo: e.target.value, region, startDate, endDate, page: "1" });
  };

  const search = (e) => {
    e.preventDefault();
    setSearchParams({ storeNo, storeCateNo, region: regionInput, startDate, endDate, page: "1" });
  };

  const goPage = (p) => setSearchParams({ storeNo, storeCateNo, region, startDate, endDate, page: String(p) });

  const filteredStores = useMemo(
    () => stores.filter((s) => s.storeName.toLowerCase().includes(storeSearch.toLowerCase())),
    [stores, storeSearch]
  );

  const resetDates = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <>
      <h3 className="mb-3">기간별 매출 조회</h3>

      {stores.length > 0 && (
        <div className="stats-store-switch">
          <label htmlFor="storeSwitch">매장 선택</label>
          <div className="store-autocomplete">
            <input
              type="text"
              id="storeSwitch"
              className="store-search-input"
              placeholder="전체 매장"
              autoComplete="off"
              value={storeSearch}
              onChange={(e) => { setStoreSearch(e.target.value); setShowSuggest(true); }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            />
            {showSuggest && (
              <ul className="store-autocomplete-list">
                <li className={!storeNo ? "active" : ""} onMouseDown={() => selectStore(null)}>
                  전체 매장
                </li>
                {filteredStores.map((s) => (
                  <li key={s.storeNo}
                    className={String(s.storeNo) === String(storeNo) ? "active" : ""}
                    onMouseDown={() => selectStore(s)}>
                    {s.storeName}
                  </li>
                ))}
                {filteredStores.length === 0 && (
                  <li className="empty">일치하는 매장이 없습니다.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      <form className="stats-search-form" onSubmit={search}>
        <input type="date" className="form-control" style={{ maxWidth: 180 }}
               value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <span style={{ color: "var(--muted)" }}>~</span>
        <input type="date" className="form-control" style={{ maxWidth: 180 }}
               value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        {isAdmin && (
          <>
            <select className="form-select" style={{ maxWidth: 160 }} value={storeCateNo} onChange={changeCate}>
              <option value="">전체 카테고리</option>
              {CATEGORIES.map((c) => <option key={c.no} value={c.no}>{c.name}</option>)}
            </select>
            <input type="text" className="form-control" style={{ maxWidth: 180 }}
              placeholder="지역 검색 (예: 강남구)"
              value={regionInput} onChange={(e) => setRegionInput(e.target.value)} />
          </>
        )}
        <button className="btn-stats-primary" type="submit">조회</button>
        <button type="button" className="btn-stats-outline" onClick={resetDates}>초기화</button>
      </form>

      <div className="stats-total-banner">
        조회 기간 합계 매출: <strong style={{ color: "var(--olive-700)" }}>{(totalSum ?? 0).toLocaleString()}원</strong>
      </div>

      <div className="stats-table-card table-responsive">
        <table className="table stats-table align-middle mb-0">
          <thead>
            <tr>
              <th>날짜</th>
              <th>주문건수</th>
              <th>매출합계</th>
              <th>평균주문가</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">조회된 데이터가 없습니다.</td>
              </tr>
            )}
            {list.map((s) => (
              <tr key={s.statsId}>
                <td>{s.statsDate}</td>
                <td>{s.orderCount}</td>
                <td>{(s.totalSales ?? 0).toLocaleString()}원</td>
                <td>{Math.round(s.avgOrder ?? 0).toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
        </table>
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

      <button type="button" className="btn-store-cta outline small mt-3" onClick={() => navigate(-1)}>
        돌아가기
      </button>
    </>
  );
}

export default StatsSalesPeriod;