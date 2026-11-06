import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import "./notice.css";

// 원본 notice/writeForm.jsp 의 필드(cateNo select, title, content, imageFile)를 그대로 이식.
// 원본은 모달 기반 이미지 미리보기(JS FileReader/DataTransfer)를 사용했지만,
// 여기서는 표준 React file input + 미리보기로 단순화했다 (동작은 동일).
function NoticeWrite() {
  const [cateNo, setCateNo] = useState("1");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  const login = (() => {
    const data = localStorage.getItem("login");
    return data ? JSON.parse(data) : null;
  })();

  useEffect(() => {
    // 원본 list.jsp의 "공지 등록" 버튼은 login.gradeNo == 9(관리자)에게만 노출됐다.
    if (login?.gradeNo !== 9) {
      alert("관리자만 접근할 수 있습니다.");
      navigate("/notice/list");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file || null);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("cateNo", cateNo);
      if (imageFile) formData.append("imageFile", imageFile);

      await http.post("/notice/write.do", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("공지가 등록되었습니다.");
      navigate("/notice/list");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "공지 등록에 실패했습니다.");
    }
  };

  return (
    <div className="notice-form-wrap">
      <h3>공지 등록</h3>
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
            <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
            {preview && (
              <img src={preview} alt="미리보기" className="img-fluid mt-2" style={{ maxHeight: 200 }} />
            )}
          </div>
          <div className="notice-form-actions">
            <button type="button" className="notice-btn-cancel" onClick={() => navigate(-1)}>취소</button>
            <button type="submit" className="notice-btn-submit">등록</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoticeWrite;