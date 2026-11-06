import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/store.css";
import MenuOptionEditor from "./MenuOptionEditor";

function MenuWrite() {
  const [searchParams] = useSearchParams();
  const storeNo = searchParams.get("storeNo");
  const [menuName, setMenuName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [groups, setGroups] = useState([]); // 옵션 그룹
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await http.post("/menu/write.do", {
        storeNo: Number(storeNo),
        menuName,
        price: Number(price),
        description,
        imageUrl,
      });
      // 메뉴 등록 후 옵션 저장
      if (groups.length > 0) {
        await http.post("/menu/option/save.do", {
          menuNo: res.data.menuNo,
          groups,
        });
      }
      navigate(`/menu/list?storeNo=${storeNo}&manage=1`, { replace: true });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "메뉴 등록에 실패했습니다.");
    }
  };

  return (
    <div className="form-card" style={{ maxWidth: 600 }}>
      <h3>메뉴 추가</h3>
      <p className="form-subtitle">판매할 메뉴 정보를 입력해주세요.</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">메뉴명</label>
          <input type="text" className="form-control" required maxLength={100}
            value={menuName} onChange={(e) => setMenuName(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">가격 (원)</label>
          <input type="number" className="form-control" required min={0}
            value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">설명</label>
          <textarea className="form-control" rows={3} maxLength={500}
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">이미지 URL</label>
          <input type="text" className="form-control" placeholder="https://..."
            value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          {imageUrl.trim() && (
            <img src={imageUrl} alt="미리보기" className="img-fluid mt-2 rounded" style={{ maxHeight: 200 }} />
          )}
        </div>

        {/* 옵션 편집기 */}
        <div className="mb-4">
          <label className="form-label fw-bold">메뉴 옵션</label>
          <MenuOptionEditor groups={groups} onChange={setGroups} />
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn-form-outline" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn-form-primary flex-grow-1">메뉴 추가</button>
        </div>
      </form>
    </div>
  );
}

export default MenuWrite;