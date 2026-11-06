import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import http from "../../api/http";
import "./stats.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// 원본 stats/dashboard.jsp 이식 + 관리자 전체 매장 통계 지원.
// "전체 매장" 선택 시 storeNo를 안 보내고, 점주는 본인 매장 전체 합산, 관리자는
// 카테고리/지역 필터에 맞는(없으면 전체) 매장을 백엔드에서 집계한다.
function StatsDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const storeNo = searchParams.get("storeNo") || "";
  const storeCateNo = searchParams.get("storeCateNo") || "";
  const region = searchParams.get("region") || "";
  const page = Number(searchParams.get("page") || 1);
  const [stores, setStores] = useState([]);
  const [storeSearch, setStoreSearch] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [list, setList] = useState([]);
  const [today, setToday] = useState(null);
  const [pageObject, setPageObject] = useState(null);
  const [regionInput, setRegionInput] = useState(region);
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
    http.get("/stats/dashboard.do", {
      params: {
        storeNo: storeNo || undefined,
        storeCateNo: isAdmin ? (storeCateNo || undefined) : undefined,
        region: isAdmin ? (region || undefined) : undefined,
        page,
      },
    })
      .then((res) => {
        setList(res.data.list);
        setToday(res.data.today);
        setPageObject(res.data.pageObject);
      })
      .catch((err) => console.error(err));
  };

  // 매장 목록(드롭다운용) - 점주는 본인 매장, 관리자는 전체 매장
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
    setSearchParams({ storeNo: s ? s.storeNo : "", storeCateNo, region, page: "1" });
  };

  // 매장 선택이 바뀌면(URL로 직접 들어온 경우 포함) 검색창 표시 텍스트를 동기화
  useEffect(() => {
    if (!storeNo) { setStoreSearch(""); return; }
    const s = stores.find((st) => String(st.storeNo) === String(storeNo));
    if (s) setStoreSearch(s.storeName);
  }, [storeNo, stores]);

  const changeCate = (e) => {
    setSearchParams({ storeNo, storeCateNo: e.target.value, region, page: "1" });
  };

  const applyRegion = (e) => {
    e.preventDefault();
    setSearchParams({ storeNo, storeCateNo, region: regionInput, page: "1" });
  };

  const goPage = (p) => setSearchParams({ storeNo, storeCateNo, region, page: String(p) });

  const filteredStores = useMemo(
    () => stores.filter((s) => s.storeName.toLowerCase().includes(storeSearch.toLowerCase())),
    [stores, storeSearch]
  );

  const chartData = useMemo(() => {
    const labels = list.map((s) => s.statsDate).reverse();
    const data = list.map((s) => s.totalSales ?? 0).reverse();
    return {
      labels,
      datasets: [{
        label: "매출액 (원)",
        data,
        borderColor: "#198754",
        backgroundColor: "rgba(25, 135, 84, 0.1)",
        tension: 0.4,
        fill: true,
      }],
    };
  }, [list]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">매출 통계</h3>
        <Link to={`/stats/sales?storeNo=${storeNo}`} className="btn-stats-outline">기간별 조회</Link>
      </div>

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

      {isAdmin && (
        <form className="stats-search-form" onSubmit={applyRegion}>
          <select className="form-select" style={{ maxWidth: 160 }} value={storeCateNo} onChange={changeCate}>
            <option value="">전체 카테고리</option>
            {CATEGORIES.map((c) => <option key={c.no} value={c.no}>{c.name}</option>)}
          </select>
          <input type="text" className="form-control" style={{ maxWidth: 200 }}
            placeholder="지역 검색 (예: 강남구)"
            value={regionInput} onChange={(e) => setRegionInput(e.target.value)} />
          <button className="btn-stats-primary" type="submit">필터 적용</button>
        </form>
      )}

      <div className="stats-summary-grid">
        <div className="stats-summary-card">
          <div className="label">오늘 매출</div>
          <div className="value">{(today?.totalSales ?? 0).toLocaleString()}원</div>
        </div>
        <div className="stats-summary-card">
          <div className="label">오늘 주문 건수</div>
          <div className="value">{today?.orderCount ?? 0}건</div>
        </div>
      </div>

      <div className="stats-chart-card">
        <h5>과거 매출 추이</h5>
        <div style={{ height: 350 }}>
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      <h5 className="mb-2" style={{ fontWeight: 800, color: "var(--ink)", fontSize: 16 }}>일별 통계</h5>
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
                <td colSpan={4} className="text-center text-muted py-4">집계된 일별 통계가 없습니다.</td>
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
    </>
  );
}

export default StatsDashboard;