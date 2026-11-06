import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/store.css";
import MenuOptionEditor from "./MenuOptionEditor";

function MenuUpdate() {
  const [searchParams] = useSearchParams();
  const menuNo = searchParams.get("menuNo");
  const [vo, setVo] = useState(null);
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    http.get("/menu/view.do", { params: { menuNo } })
      .then((res) => setVo(res.data))
      .catch((err) => console.error(err));
    // 기존 옵션 불러오기
    http.get("/menu/option/list.do", { params: { menuNo } })
      .then((res) => setGroups(res.data || []))
      .catch(() => {});
  }, [menuNo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await http.post("/menu/update.do", vo);
      // 옵션 저장 (빈 배열이면 전체 삭제)
      await http.post("/menu/option/save.do", { menuNo: Number(menuNo), groups });
      navigate(`/menu/list?storeNo=${vo.storeNo}&manage=1`, { replace: true });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "메뉴 수정에 실패했습니다.");
    }
  };

  if (!vo) return <div className="text-center py-5 text-muted">불러오는 중...</div>;

  return (
    <div className="form-card" style={{ maxWidth: 600 }}>
      <h3>메뉴 수정</h3>
      <p className="form-subtitle">{vo.menuName}</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">메뉴명</label>
          <input type="text" className="form-control" required maxLength={100}
            value={vo.menuName} onChange={(e) => setVo({ ...vo, menuName: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">가격 (원)</label>
          <input type="number" className="form-control" required min={0}
            value={vo.price} onChange={(e) => setVo({ ...vo, price: Number(e.target.value) })} />
        </div>
        <div className="mb-3">
          <label className="form-label">설명</label>
          <textarea className="form-control" rows={3} maxLength={500}
            value={vo.description || ""} onChange={(e) => setVo({ ...vo, description: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">이미지 URL</label>
          <input type="text" className="form-control"
            value={vo.imageUrl || ""} onChange={(e) => setVo({ ...vo, imageUrl: e.target.value })} />
          {vo.imageUrl && vo.imageUrl.trim() && (
            <img src={vo.imageUrl} alt="미리보기" className="img-fluid mt-2 rounded" style={{ maxHeight: 200 }} />
          )}
        </div>

        {/* 옵션 편집기 */}
        <div className="mb-4">
          <label className="form-label fw-bold">메뉴 옵션</label>
          <MenuOptionEditor groups={groups} onChange={setGroups} />
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn-form-outline" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn-form-primary flex-grow-1">수정 완료</button>
        </div>
      </form>
    </div>
  );
}

export default MenuUpdate;