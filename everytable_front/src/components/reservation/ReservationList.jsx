import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "./reservation.css";

// res_status: 1=결제 전, 2=승인, 3=완료, 4=취소 처리 중, 5=취소
const STATUS = [
  { key: "0", label: "전체" },
  { key: "1", label: "결제 전" },
  { key: "2", label: "승인" },
  { key: "3", label: "완료" },
  { key: "4", label: "취소 처리 중" },
  { key: "5", label: "취소" },
];

const statusPill = (status) => "s" + status;

const statusLabel = (status) => {
  if (status === 1) return "결제 전";
  if (status === 2) return "예약 확정";
  if (status === 3) return "이용 완료";
  if (status === 4) return "취소 처리 중";
  if (status === 5) return "취소됨";
  return "알 수 없음";
};

function ReservationList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") || 1);
  const key  = searchParams.get("key") || "0";
  const [list, setList]         = useState([]);
  const [pageObject, setPageObject] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    http
      .get("/reservation/list.do", { params: { page, key } })
      .then((res) => { setList(res.data.list || []); setPageObject(res.data.pageObject || null); })
      .catch(() => setError("예약 목록을 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [page, key]);

  const changeStatus = (s) => setSearchParams({ page: "1", key: s });
  const goPage = (p) => setSearchParams({ page: String(p), key });

  if (loading) return <div className="text-center py-5 text-muted">불러오는 중...</div>;
  if (error)   return <div className="res-alert warn" style={{ background: "#FBEAEA", borderColor: "#E3B8B8", color: "#A23E3E" }}>{error}</div>;

  return (
    <>
      <h3 className="mb-3">내 예약 내역</h3>
      <div className="res-status-tabs">
        {STATUS.map((s) => (
          <button key={s.key} type="button"
            className={"res-status-tab" + (key === s.key ? " active" : "")}
            onClick={() => changeStatus(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-muted">예약 데이터가 존재하지 않습니다.</p>
      ) : (
        <div className="res-table-card table-responsive">
          <table className="table res-table align-middle mb-0">
            <thead>
              <tr>
                <th>매장명</th>
                <th>방문 일시</th>
                <th>인원 / 유형</th>
                <th>상태</th>
                <th>리뷰</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.resNo} onClick={() => navigate(`/reservation/view?no=${r.resNo}`)}>
                  <td>
                    <span className="store-name">{r.storeName || "매장 정보 없음"}</span>
                    <span className="no">No.{r.resNo}</span>
                  </td>
                  <td>{r.resDate} {r.resTime}</td>
                  <td>{r.resCount}명 ({r.resType})</td>
                  <td><span className={"res-pill " + statusPill(r.resStatus)}>{statusLabel(r.resStatus)}</span></td>
                  <td>
                    {r.resStatus === 3 ? (
                      r.reviewNo ? (
                        <span className="text-muted">작성완료</span>
                      ) : (
                        <button className="btn-res-sm approve"
                          onClick={(e) => { e.stopPropagation(); navigate(`/review/writeForm?resNo=${r.resNo}`); }}>
                          리뷰 작성
                        </button>
                      )
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </>
  );
}

export default ReservationList;
