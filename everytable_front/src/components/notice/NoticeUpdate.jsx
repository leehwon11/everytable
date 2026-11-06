import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import http, { API_BASE } from "../../api/http";
import "./notice.css";

function NoticeUpdate() {
  const [searchParams] = useSearchParams();
  const no = searchParams.get("no");
  const [cateNo, setCateNo] = useState("1");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [existingImage, setExistingImage] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();

  useEffect(() => {
    if (login?.gradeNo !== 9) {
      alert("관리자만 접근할 수 있습니다.");
      navigate("/notice/list");
      return;
    }
    http.get("/notice/view.do", { params: { no, inc: 0 } })
      .then((res) => {
        const n = res.data;
        setCateNo(String(n.cateNo));
        setTitle(n.title);
        setContent(n.content);
        setExistingImage(n.fileName);
      })
      .catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [no]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file || null);
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setDeleteImage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("no", no);
      formData.append("title", title);
      formData.append("content", content);
      formData.append("cateNo", cateNo);
      formData.append("deleteImage", deleteImage);
      if (imageFile) formData.append("imageFile", imageFile);

      await http.post("/notice/update.do", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("수정되었습니다.");
      navigate(`/notice/view?no=${no}`, { replace: true, state: { backgroundLocation: location.state?.backgroundLocation } });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "수정에 실패했습니다.");
    }
  };

  return (
    <div className="notice-form-wrap">
      <h3>공지 수정</h3>
      <div className="notice-form-card">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">카테고리</label>
            <select className="form-select" value={cateNo} onChange={(e) => setCateNo(e.target.value)}>
              <option value="1">공지사항</option>
              <option value="2">시스템</option>
              <option value="3">이벤트</option>
              <option value="4">업데이트</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">제목</label>
            <input type="text" className="form-control" required maxLength={200}
              value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">내용</label>
            <textarea className="form-control" rows={8} required
              value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">첨부 이미지</label>
            {existingImage && !deleteImage && !preview && (
              <div className="mb-2">
                <img src={API_BASE + existingImage} alt="기존 이미지" className="img-fluid" style={{ maxHeight: 200 }} />
                <div className="form-check mt-1">
                  <input type="checkbox" className="form-check-input" id="deleteImage"
                    checked={deleteImage} onChange={(e) => setDeleteImage(e.target.checked)} />
                  <label className="form-check-label" htmlFor="deleteImage">기존 이미지 삭제</label>
                </div>
              </div>
            )}
            <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
            {preview && (
              <img src={preview} alt="미리보기" className="img-fluid mt-2" style={{ maxHeight: 200 }} />
            )}
          </div>
          <div className="notice-form-actions">
            <button type="button" className="notice-btn-cancel" onClick={() => navigate(`/notice/view?no=${no}`,
              { replace: true, state: { backgroundLocation: location.state?.backgroundLocation }})}>수정 취소</button>
            <button type="submit" className="notice-btn-submit">수정 완료</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoticeUpdate;