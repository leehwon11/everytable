import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "./payment.css";

const pillClass = (status) => {
  if (status === "SUCCESS") return "success";
  if (status === "PENDING") return "pending";
  if (status === "REFUNDED") return "refunded";
  return "fail";
};

// 💡 상태 영어를 한글 텍스트로 변환해 주는 함수
const statusLabel = (status) => {
  if (status === "SUCCESS") return "결제 완료";
  if (status === "PENDING") return "결제 대기";
  if (status === "REFUNDED") return "환불 완료";
  if (status === "FAIL") return "결제 실패";
  return status;
};

function PaymentList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") || 1);
  const key = searchParams.get("key") || "";
  const word = searchParams.get("word") || "";
  const [searchKey, setSearchKey] = useState(key || "m");
  const [searchWord, setSearchWord] = useState(word);
  const [list, setList] = useState([]);
  const [pageObject, setPageObject] = useState(null);
  const navigate = useNavigate();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();
  const isAdmin = login?.gradeNo === 9;

  useEffect(() => {
    http.get("/payment/list.do", { params: { page, key: key || undefined, word: word || undefined } })
      .then((res) => {
        setList(res.data.list);
        setPageObject(res.data.pageObject);
      })
      .catch((err) => console.error(err));
  }, [page, key, word]);

  const search = (e) => {
    e.preventDefault();
    setSearchParams({ page: "1", key: searchKey, word: searchWord });
  };

  const goPage = (p) => setSearchParams({ page: String(p), key, word });

  return (
    <>
      <h3 className="mb-3">{isAdmin ? "결제 관리 (전체)" : "나의 결제 내역"}</h3>

      {isAdmin && (
        <form className="payment-search-form" onSubmit={search}>
          <select className="form-select" style={{ width: "auto" }} value={searchKey} onChange={(e) => setSearchKey(e.target.value)}>
            <option value="m">결제수단</option>
            <option value="u">아이디</option>
            <option value="s">결제상태</option>
            <option value="mu">수단/아이디</option>
          </select>
          <input type="text" className="form-control" placeholder="검색어 입력" value={searchWord} onChange={(e) => setSearchWord(e.target.value)} />
          <button className="payment-search-btn" type="submit">검색</button>
        </form>
      )}

      <div className="payment-table-card table-responsive">
        <table className="table payment-table align-middle mb-0">
          <thead>
            <tr>
              <th>주문번호</th>
              {isAdmin && <th>아이디</th>}
              <th>결제수단</th>
              <th>결제금액</th>
              <th>상태</th>
              <th>결제일</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={isAdmin ? 6 : 5} className="text-center text-muted py-4">결제 내역이 존재하지 않습니다.</td></tr>
            )}
            {list.map((p) => (
              <tr key={p.paymentNo} onClick={() => navigate(`/payment/view?no=${p.paymentNo}`)}>
                <td>{p.orderNo}</td>
                {isAdmin && <td>{p.userName}</td>}
                <td>{p.method}</td>
                <td className="amount">{p.amount.toLocaleString()}원</td>
                {/* 💡 statusLabel 함수를 적용하여 한글로 출력 */}
                <td><span className={"payment-pill " + pillClass(p.status)}>{statusLabel(p.status)}</span></td>
                <td>{p.payDate}</td>
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

export default PaymentList;