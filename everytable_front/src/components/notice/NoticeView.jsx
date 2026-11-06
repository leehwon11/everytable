import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import http, { API_BASE } from "../../api/http";
import "./notice.css";

function NoticeView() {
  const [searchParams] = useSearchParams();
  const no = searchParams.get("no");
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();
  const isAdmin = login?.gradeNo === 9;

  useEffect(() => {
    // 목록에서 상세로 처음 들어올 때만 조회수를 증가시킨다 (원본 notice/view.jsp의 inc 파라메터와 동일한 방식).
    http.get("/notice/view.do", { params: { no, inc: 1 } })
      .then((res) => setNotice(res.data))
      .catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [no]);

  const remove = async () => {
    if (!confirm("이 공지를 삭제하시겠습니까?")) return;
    try {
      await http.post("/notice/delete.do", { no });
      alert("삭제되었습니다.");
      navigate("/notice/list");
    } catch (err) {
      console.error(err);
      alert("삭제에 실패했습니다.");
    }
  };

  if (!notice) return null;

  return (
    <div className="notice-view-card">
      <span className="notice-view-cate">{notice.cateName}</span>
      <h3>{notice.title}</h3>
      <div className="notice-view-meta">
        <span className="writer">{notice.writerName}</span>
        <span>{notice.writeDate}{notice.updateDate && notice.updateDate !== notice.writeDate ? ` (수정됨 ${notice.updateDate})` : ""}</span>
        <span>조회수 {notice.hit}</span>
      </div>

      {notice.fileName && (
        <img src={API_BASE + notice.fileName} alt="첨부 이미지" className="img-fluid" />
      )}

      <p className="notice-view-content">{notice.content}</p>

      <div className="notice-view-actions">
        <Link to="/notice/list" className="btn-notice-outline">목록</Link>
        {isAdmin && (
          <>
            <Link to={`/notice/update?no=${notice.noticeNo}`} className="btn-notice-outline">수정</Link>
            <button className="btn-notice-danger" onClick={remove}>삭제</button>
          </>
        )}
      </div>
    </div>
  );
}

export default NoticeView;
