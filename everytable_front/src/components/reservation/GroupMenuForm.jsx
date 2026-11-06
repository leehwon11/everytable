import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "../store/Store.css";
import "./reservation.css";

const buildOp = (opts) => {
  const parts = Object.entries(opts || {})
    .flatMap(([name, vals]) => {
      if (Array.isArray(vals)) {
        return vals.filter(Boolean).map((v) => `${name}=${v.optionValue}`);
      }
      return vals ? [`${name}=${vals.optionValue}`] : []; // null이면 스킵
    });
  return parts.length > 0 ? parts.join(",") : null;
};

const opKey = (menuNo, opts) => `${menuNo}__${buildOp(opts) || ""}`;

function GroupMenuForm() {
  const [searchParams] = useSearchParams();
  const resNo = searchParams.get("resNo");
  const [vo, setVo]               = useState(null);
  const [menuList, setMenuList]   = useState([]);
  const [optionMap, setOptionMap] = useState({});
  // cart: [{ menuNo, menuName, price, imageUrl, selectedOpts, qty, adds }]
  const [cart, setCart]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState(null);
  const [modal, setModal]         = useState(null);
  const [modalOpts, setModalOpts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!resNo) { setError("잘못된 접근입니다."); setLoading(false); return; }
    http.get("/reservation/groupMenuForm.do", { params: { resNo } })
      .then(async (res) => {
        setVo(res.data.vo);
        const menus = res.data.menuList || [];
        setMenuList(menus);
        const map = {};
        await Promise.all(menus.map(async (m) => {
          try {
            const r = await http.get("/menu/option/list.do", { params: { menuNo: m.menuNo } });
            map[m.menuNo] = r.data || [];
          } catch { map[m.menuNo] = []; }
        }));
        setOptionMap(map);
      })
      .catch(() => setError("메뉴 정보를 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [resNo]);

  const handleMenuClick = (m) => {
    const groups = optionMap[m.menuNo] || [];
    if (groups.length > 0) {
      const initOpts = {};
      groups.forEach((g) => { initOpts[g.optionName] = g.isMultiple === 1 ? [] : null; });
      setModalOpts(initOpts);
      setModal({ menu: m });
    } else {
      addToCart(m, {});
    }
  };

  const addToCart = (m, selectedOpts) => {
    const key = opKey(m.menuNo, selectedOpts);
    const extra = calcExtra(selectedOpts);
    setCart((prev) => {
      const idx = prev.findIndex((c) => opKey(c.menuNo, c.selectedOpts) === key);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      }
      return [...prev, {
        menuNo: m.menuNo,
        menuName: m.menuName,
        price: m.price + extra,
        basePrice: m.price,
        imageUrl: m.imageUrl,
        selectedOpts,
        qty: 1,
        adds: "",  // 각 메뉴별 요청사항
      }];
    });
  };

  const calcExtra = (opts) =>
    Object.values(opts || {}).flatMap((v) => Array.isArray(v) ? v : [v])
      .reduce((s, v) => s + (v?.additionalPrice || 0), 0);

  const toggleOpt = (group, val) => {
    setModalOpts((prev) => {
      if (group.isMultiple === 1) {
        const arr = prev[group.optionName] || [];
        const exists = arr.find((v) => v.optionValue === val.optionValue);
        return { ...prev, [group.optionName]: exists ? arr.filter((v) => v.optionValue !== val.optionValue) : [...arr, val] };
      } else {
        const cur = prev[group.optionName];
        return { ...prev, [group.optionName]: cur?.optionValue === val.optionValue ? null : val };
      }
    });
  };

  const confirmModal = () => {
    const groups = optionMap[modal.menu.menuNo] || [];
    for (const g of groups) {
      if (g.isRequired === 1) {
        const v = modalOpts[g.optionName];
        if (!v || (Array.isArray(v) && v.length === 0)) {
          alert(`"${g.optionName}" 옵션은 필수입니다.`); return;
        }
      }
    }
    addToCart(modal.menu, modalOpts);
    setModal(null);
    setModalOpts({});
  };

  const changeCartQty = (idx, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const next = updated[idx].qty + delta;
      if (next <= 0) return updated.filter((_, i) => i !== idx);
      updated[idx] = { ...updated[idx], qty: next };
      return updated;
    });
  };

  // 장바구니 항목별 요청사항 변경
  const changeCartAdds = (idx, value) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], adds: value };
      return updated;
    });
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) { alert("메뉴를 1개 이상 선택해주세요."); return; }
    setSubmitting(true);
    try {
      // 각 장바구니 행을 별개 주문으로 전송
      await http.post("/reservation/groupOrderWrite.do", {
        resNo: Number(resNo),
        menuNos:    cart.map((c) => c.menuNo),
        quantities: cart.map((c) => c.qty),
        adds:       cart.map((c) => c.adds.trim() || null),  // 배열로 전송
        ops:        cart.map((c) => buildOp(c.selectedOpts)),
      });
      navigate("/reservation/groupOrderComplete");
    } catch {
      alert("주문 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-5 text-muted">메뉴를 불러오는 중...</div>;
  if (error)   return <div className="res-alert warn m-3">{error}</div>;
  if (!vo)     return null;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 100 }}>
      <div style={{ padding: "16px 0 12px" }}>
        <h3 className="mb-0" style={{ color: "var(--ink)" }}>메뉴 선택</h3>
        <p className="text-muted small mb-0">{vo.storeName} · 예약번호 No.{resNo}</p>
      </div>

      {/* 메뉴 그리드 */}
      <div className="menu-grid">
        {menuList.map((m) => {
          const hasOpt = (optionMap[m.menuNo] || []).length > 0;
          return (
            <div className="menu-card" key={m.menuNo} style={{ cursor: "pointer" }}
              onClick={() => handleMenuClick(m)}>
              <div className="menu-card-image">
                {m.imageUrl
                  ? <img src={m.imageUrl} alt={m.menuName} />
                  : <span className="no-image">이미지 없음</span>}
              </div>
              <div className="menu-card-body">
                <h6>{m.menuName}</h6>
                {m.description && <p className="desc">{m.description}</p>}
                <div className="d-flex justify-content-between align-items-center mt-auto">
                  <p className="price mb-0">{m.price?.toLocaleString()}원</p>
                  {hasOpt && (
                    <span style={{ fontSize: 11, color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px" }}>
                      옵션선택
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {menuList.length === 0 && <p className="text-muted">등록된 메뉴가 없습니다.</p>}
      </div>

      {/* 장바구니 */}
      {cart.length > 0 && (
        <div className="res-detail-card mb-3" style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--olive-700)", marginBottom: 12 }}>
            🛒 장바구니
          </div>
          {cart.map((c, idx) => {
            const opStr = buildOp(c.selectedOpts);
            return (
              <div key={idx} style={{
                paddingBottom: 14, marginBottom: 14,
                borderBottom: idx < cart.length - 1 ? "1px solid var(--border)" : "none"
              }}>
                {/* 메뉴 행 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{c.menuName}</div>
                    {opStr && (
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                        {opStr.split(",").map((s, i) => {
                          const [name, val] = s.split("=");
                          return <span key={i} style={{ marginRight: 6 }}>{name}: <strong>{val}</strong></span>;
                        })}
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: "var(--olive-700)", fontWeight: 600, marginTop: 2 }}>
                      {c.price.toLocaleString()}원
                      {c.price > c.basePrice && (
                        <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11, marginLeft: 4 }}>
                          ({c.basePrice.toLocaleString()}+{(c.price - c.basePrice).toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 수량 */}
                  <div className="d-flex align-items-center gap-2 ms-2">
                    <button type="button" onClick={() => changeCartQty(idx, -1)}
                      style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer", fontWeight: 700, outline: "none" }}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{c.qty}</span>
                    <button type="button" onClick={() => changeCartQty(idx, 1)}
                      style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer", fontWeight: 700, outline: "none" }}>+</button>
                  </div>
                </div>

                {/* 메뉴별 요청사항 */}
                <div style={{ marginTop: 8 }}>
                  <input type="text" className="form-control form-control-sm"
                    placeholder={`${c.menuName} 요청사항 (예: 덜 맵게, 파 빼주세요)`}
                    value={c.adds}
                    onChange={(e) => changeCartAdds(idx, e.target.value)}
                    maxLength={200}
                    style={{ fontSize: 12.5, color: "var(--ink)" }} />
                </div>
              </div>
            );
          })}

          {/* 합계 */}
          <div className="res-order-total" style={{ marginTop: 4 }}>
            <span>합계</span>
            <span>{cartTotal.toLocaleString()}원</span>
          </div>
        </div>
      )}

      {/* 하단 고정 버튼 */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid var(--border)", padding: "12px 20px", zIndex: 100 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <button className="btn-res-success" onClick={handleSubmit}
            disabled={submitting || cart.length === 0}
            style={{
              width: "100%", padding: "14px", fontSize: 16, textAlign: "center",
              opacity: cart.length === 0 ? 0.5 : 1,
              cursor: cart.length === 0 ? "not-allowed" : "pointer"
            }}>
            {submitting ? "처리 중..." : cart.length === 0 ? "메뉴를 선택해주세요" : `${cartTotal.toLocaleString()}원 · 주문 완료`}
          </button>
        </div>
      </div>

      {/* 옵션 선택 모달 */}
      {modal && (
        <div className="modal d-block" style={{ background: "rgba(46,58,31,0.45)" }}
          onClick={() => { setModal(null); setModalOpts({}); }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-content p-4">
              <h5 className="fw-bold mb-1" style={{ color: "var(--ink)" }}>{modal.menu.menuName}</h5>
              <p className="text-muted small mb-3">{modal.menu.price?.toLocaleString()}원 · 옵션을 선택해주세요</p>

              {(optionMap[modal.menu.menuNo] || []).map((group) => (
                <div key={group.optionName} className="mb-3">
                  <div className="small fw-bold mb-2" style={{ color: "var(--olive-700)" }}>
                    {group.optionName}
                    {group.isRequired === 1 && <span className="text-danger ms-1">*필수</span>}
                    {group.isMultiple === 1 && <span className="text-muted ms-1">(복수 선택 가능)</span>}
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {group.values.map((val) => {
                      const cur = modalOpts[group.optionName];
                      const selected = group.isMultiple === 1
                        ? (cur || []).some((v) => v.optionValue === val.optionValue)
                        : cur?.optionValue === val.optionValue;
                      return (
                        <button key={val.optionValue} type="button"
                          onClick={() => toggleOpt(group, val)}
                          style={{
                            padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                            cursor: "pointer", border: "1px solid", outline: "none",
                            background: selected ? "var(--olive-700)" : "transparent",
                            borderColor: selected ? "var(--olive-700)" : "var(--border)",
                            color: selected ? "#F3F1E6" : "var(--muted)",
                            transition: "all 0.15s"
                          }}>
                          {val.optionValue}
                          {val.additionalPrice > 0 && ` +${val.additionalPrice.toLocaleString()}원`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {(() => {
                const extra = calcExtra(modalOpts);
                return extra > 0 ? (
                  <div style={{ fontSize: 13, color: "var(--olive-700)", fontWeight: 600, marginBottom: 12 }}>
                    추가금: +{extra.toLocaleString()}원 → 합계 {(modal.menu.price + extra).toLocaleString()}원
                  </div>
                ) : null;
              })()}

              <div className="d-flex gap-2 mt-2">
                <button className="btn-res-outline" style={{ flex: 1, padding: "10px", textAlign: "center" }}
                  onClick={() => { setModal(null); setModalOpts({}); }}>취소</button>
                <button className="btn-res-success" style={{ flex: 2, padding: "10px", textAlign: "center" }}
                  onClick={confirmModal}>장바구니 담기</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupMenuForm;