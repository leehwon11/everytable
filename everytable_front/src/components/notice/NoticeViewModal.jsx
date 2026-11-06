import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import http, { API_BASE } from "../../api/http";
import "./notice.css";

// 공지 목록 위에 겹쳐 뜨는 모달 버전. 목록에서 클릭했을 때만 이 컴포넌트가 쓰이고,
// 주소를 직접 입력하거나 새로고침하면 App.jsx의 background location 로직에 따라
// 이 모달이 아니라 NoticeView(전체 화면)가 대신 렌더링된다.
function NoticeViewModal() {
  const [searchParams] = useSearchParams();
  const no = searchParams.get("no");
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();
  const isAdmin = login?.gradeNo === 9;

  useEffect(() => {
    http.get("/notice/view.do", { params: { no, inc: 1 } })
      .then((res) => setNotice(res.data))
      .catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [no]);

  // 뒤로가기(모달을 열기 전 목록 상태)로 복귀 - 목록의 페이지/필터 상태가 그대로 유지된다.
  const close = () => navigate(location.state?.backgroundLocation ?? "/notice/list");

  const remove = async () => {
    if (!confirm("이 공지를 삭제하시겠습니까?")) return;
    try {
      await http.post("/notice/delete.do", { no });
      alert("삭제되었습니다.");
      navigate("/notice/list", { replace: true });
    } catch (err) {
      console.error(err);
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="modal d-block" tabIndex={-1} role="dialog" onClick={close}>
        <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            {!notice ? (
              <div className="modal-body text-center py-5 text-muted">불러오는 중...</div>
            ) : (
              <>
                <div className="modal-header notice-view-modal">
                  <div>
                    <span className="notice-view-cate">{notice.cateName}</span>
                    <h5 className="modal-title mb-0 mt-1">{notice.title}</h5>
                  </div>
                  <button type="button" className="btn-close" onClick={close}></button>
                </div>
                <div className="modal-body notice-view-modal">
                  <div className="notice-view-meta mb-3">
                    <span className="writer">{notice.writerName}</span>
                    <span>{notice.writeDate}{notice.updateDate && notice.updateDate !== notice.writeDate ? ` (수정됨 ${notice.updateDate})` : ""}</span>
                    <span>조회수 {notice.hit}</span>
                  </div>

                  {notice.fileName && (
                    <img src={API_BASE + notice.fileName} alt="첨부 이미지" className="img-fluid" />
                  )}

                  <p className="notice-view-content">{notice.content}</p>
                </div>
                {isAdmin && (
                  <div className="modal-footer">
                    <button className="btn-notice-outline" onClick={() => navigate(`/notice/update?no=${notice.noticeNo}`,
                      { state: { backgroundLocation: location.state?.backgroundLocation } })}>수정</button>
                    <button className="btn-notice-danger" onClick={remove}>삭제</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </>
  );
}

export default NoticeViewModal;