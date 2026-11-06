import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";
import "./reservation.css";

// op 문자열 생성 (단일/복수 모두 처리)
const buildOp = (opts) =>
  Object.entries(opts || {})
    .flatMap(([name, vals]) =>
      Array.isArray(vals)
        ? vals.map((v) => `${name}=${v.optionValue}`)
        : vals ? [`${name}=${vals.optionValue}`] : []
    )
    .join(",") || null;

// 장바구니 중복 체크용 키
const cartKey = (menuNo, opts) => `${menuNo}__${buildOp(opts) || ""}`;

function ReservationUpdateForm() {
  const [searchParams] = useSearchParams();
  const no = searchParams.get("no");
  const [vo, setVo]                     = useState(null);
  const [storeMenuList, setStoreMenuList] = useState([]);
  const [optionMap, setOptionMap]       = useState({}); // menuNo -> groups
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState(null);
  const [resPhone, setResPhone]         = useState("");
  const [resDate, setResDate]           = useState("");
  const [resTime, setResTime]           = useState("");
  const [resCount, setResCount]         = useState("");
  const [resType, setResType]           = useState("단체");
  const [orderAdd, setOrderAdd]         = useState("");

  // cart: [{ menuNo, menuName, basePrice, price, selectedOpts, qty }]
  const [cart, setCart]                 = useState([]);

  // 메뉴 추가 옵션 모달
  const [modal, setModal]               = useState(null); // { menu } | null
  const [modalOpts, setModalOpts]       = useState({});

  const navigate = useNavigate();

  const loadOptions = async (menuNo) => {
    if (optionMap[menuNo]) return optionMap[menuNo];
    try {
      const res = await http.get("/menu/option/list.do", { params: { menuNo } });
      const groups = res.data || [];
      setOptionMap((prev) => ({ ...prev, [menuNo]: groups }));
      return groups;
    } catch { return []; }
  };

  useEffect(() => {
    http.get("/reservation/view.do", { params: { no } })
      .then(async (res) => {
        const data = res.data;
        setVo(data);
        setResPhone(data.resPhone || "");
        setResDate(data.resDate || "");
        setResTime(data.resTime || "");
        setResCount(data.resCount || "");
        setResType(data.resType || "단체");
        setOrderAdd(data.orderAdd || "");

        // 기존 주문 → cart로 변환
        const map = {};
        const initialCart = await Promise.all(
          (data.orderList || []).map(async (item) => {
            const groups = await http.get("/menu/option/list.do", { params: { menuNo: item.menuNo } })
              .then((r) => r.data || []).catch(() => []);
            map[item.menuNo] = groups;

            // 기존 op 문자열 → selectedOpts 파싱
            const selectedOpts = {};
            if (item.op) {
              item.op.split(",").forEach((s) => {
                const idx = s.indexOf("=");
                if (idx > 0) {
                  const name = s.slice(0, idx).trim();
                  const value = s.slice(idx + 1).trim();
                  const group = groups.find((g) => g.optionName === name);
                  const val = group?.values.find((v) => v.optionValue === value);
                  if (group?.isMultiple === 1) {
                    if (!selectedOpts[name]) selectedOpts[name] = [];
                    selectedOpts[name].push({ optionValue: value, additionalPrice: val?.additionalPrice || 0 });
                  } else {
                    selectedOpts[name] = { optionValue: value, additionalPrice: val?.additionalPrice || 0 };
                  }
                }
              });
            }
            const extra = calcExtra(selectedOpts);
            return {
              menuNo: item.menuNo,
              menuName: item.menuName,
              basePrice: item.price - extra < 0 ? item.price : item.price - extra,
              price: item.price,
              selectedOpts,
              qty: item.quantity,
            };
          })
        );
        setCart(initialCart);
        setOptionMap(map);

        return http.get("/reservation/storeMenuList.do", { params: { storeNo: data.storeNo } });
      })
      .then((res) => setStoreMenuList(res.data || []))
      .catch(() => setError("예약 정보를 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [no]);

  const calcExtra = (opts) =>
    Object.values(opts || {}).flatMap((v) => Array.isArray(v) ? v : (v ? [v] : []))
      .reduce((s, v) => s + (v?.additionalPrice || 0), 0);

  // 메뉴 추가 버튼
  const handleAddMenu = async (menuNo) => {
    const menu = storeMenuList.find((m) => m.menuNo === menuNo);
    if (!menu) return;
    const groups = await loadOptions(menuNo);
    if (groups.length > 0) {
      const initOpts = {};
      groups.forEach((g) => { initOpts[g.optionName] = g.isMultiple === 1 ? [] : null; });
      setModalOpts(initOpts);
      setModal({ menu, groups });
    } else {
      addToCart(menu, {});
    }
  };

  // 장바구니 추가
  const addToCart = (menu, selectedOpts) => {
    const key = cartKey(menu.menuNo, selectedOpts);
    const extra = calcExtra(selectedOpts);
    setCart((prev) => {
      const idx = prev.findIndex((c) => cartKey(c.menuNo, c.selectedOpts) === key);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      }
      return [...prev, {
        menuNo: menu.menuNo,
        menuName: menu.menuName,
        basePrice: menu.price,
        price: menu.price + extra,
        selectedOpts,
        qty: 1,
      }];
    });
  };

  // 모달 옵션 토글
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
    for (const g of modal.groups) {
      if (g.isRequired === 1) {
        const v = modalOpts[g.optionName];
        if (!v || (Array.isArray(v) && v.length === 0)) {
          alert(`"${g.optionName}" 옵션은 필수입니다.`); return;
        }
      }
    }
    addToCart(modal.menu, modalOpts);
    setModal(null);
  };

  // 수량 변경
  const changeCartQty = (idx, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const next = updated[idx].qty + delta;
      if (next <= 0) return updated.filter((_, i) => i !== idx);
      updated[idx] = { ...updated[idx], qty: next };
      return updated;
    });
  };

  const total = useMemo(() => cart.reduce((s, c) => s + c.price * c.qty, 0), [cart]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) { alert("메뉴를 1개 이상 선택해주세요."); return; }
    setSubmitting(true);
    try {
      await http.post("/reservation/update.do", {
        resNo: Number(no),
        resPhone, resDate, resTime,
        resCount: Number(resCount),
        resType, orderAdd,
        totalPrice: total,
        menuNos:    cart.map((c) => c.menuNo),
        quantities: cart.map((c) => c.qty),
        prices:     cart.map((c) => c.price),
        ops:        cart.map((c) => buildOp(c.selectedOpts)),
      });
      navigate(`/reservation/view?no=${no}`);
    } catch (err) {
      alert(err.response?.data?.message || "예약 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-5 text-muted">불러오는 중...</div>;
  if (error)   return <div className="res-alert warn">{error}</div>;
  if (!vo)     return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto" style={{ maxWidth: 820 }}>
      <h3 className="mb-4">예약 수정</h3>
      <div className="res-detail-card">
        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            {/* 왼쪽: 예약 기본 정보 */}
            <div className="col-12 col-md-5">
              <div className="res-detail-col-title">Reservation Info</div>
              <label className="form-label">매장명</label>
              <input type="text" className="form-control mb-2" value={vo.storeName || ""} readOnly disabled />
              <label className="form-label">연락처</label>
              <input type="tel" className="form-control mb-2" required
                placeholder="숫자만 입력 (예: 01012345678)"
                value={resPhone} onChange={(e) => setResPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))} />
              <label className="form-label">방문 예정 일시</label>
              <div className="d-flex gap-2 mb-2">
                <input type="date" className="form-control" required min={today}
                  value={resDate} onChange={(e) => setResDate(e.target.value)} />
                <input type="time" className="form-control" required
                  value={resTime} onChange={(e) => setResTime(e.target.value)} />
              </div>
              <label className="form-label">예약 인원</label>
              <input type="number" className="form-control mb-2" required min={1} max={100}
                value={resCount} onChange={(e) => setResCount(e.target.value)} />
              <label className="form-label">예약 유형</label>
              <select className="form-select mb-2" value={resType} onChange={(e) => setResType(e.target.value)}>
                <option value="단체">단체</option>
                <option value="픽업">픽업</option>
              </select>
              <label className="form-label">요청 사항</label>
              <input type="text" className="form-control"
                value={orderAdd} onChange={(e) => setOrderAdd(e.target.value)} />
            </div>

            {/* 오른쪽: 장바구니 + 메뉴 추가 */}
            <div className="col-12 col-md-7">
              <div className="res-detail-col-title">Order Menu</div>

              {/* 장바구니 목록 */}
              {cart.length === 0 ? (
                <p className="text-muted small mb-3">아래에서 메뉴를 추가해주세요.</p>
              ) : (
                cart.map((c, idx) => {
                  const opStr = buildOp(c.selectedOpts);
                  return (
                    <div key={idx} className="border rounded-3 p-3 mb-2" style={{ background: "var(--cream)" }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 14 }}>{c.menuName}</div>
                          {opStr && (
                            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                              {opStr.split(",").map((s, i) => {
                                const [name, val] = s.split("=");
                                return <span key={i} className="me-2">{name}: <strong>{val}</strong></span>;
                              })}
                            </div>
                          )}
                          <div style={{ fontSize: 13, color: "var(--olive-700)", fontWeight: 600, marginTop: 3 }}>
                            {c.price.toLocaleString()}원
                            {c.price > c.basePrice && (
                              <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11, marginLeft: 4 }}>
                                ({c.basePrice.toLocaleString()}+{(c.price - c.basePrice).toLocaleString()})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 ms-2">
                          <button type="button" onClick={() => changeCartQty(idx, -1)}
                            style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "#fff", cursor: "pointer", fontWeight: 700 }}>−</button>
                          <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{c.qty}</span>
                          <button type="button" onClick={() => changeCartQty(idx, 1)}
                            style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "#fff", cursor: "pointer", fontWeight: 700 }}>+</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* 메뉴 추가 */}
              <div className="d-flex gap-2 mt-2 mb-3">
                <select className="form-select form-select-sm" defaultValue=""
                  onChange={(e) => { if (e.target.value) handleAddMenu(Number(e.target.value)); e.target.value = ""; }}>
                  <option value="">-- 추가할 메뉴 선택 --</option>
                  {storeMenuList.map((m) => (
                    <option key={m.menuNo} value={m.menuNo}>{m.menuName} ({m.price.toLocaleString()}원)</option>
                  ))}
                </select>
              </div>

              <div className="res-order-total">
                <span>최종 결제 금액</span>
                <span>{total.toLocaleString()}원</span>
              </div>
            </div>
          </div>

          <div className="res-detail-actions">
            <button type="submit" className="btn-res-primary" disabled={submitting}>
              {submitting ? "처리 중..." : "수정 완료"}
            </button>
            <button type="button" className="btn-res-outline" onClick={() => navigate(-1)}>취소</button>
          </div>
        </form>
      </div>

      {/* 옵션 선택 모달 */}
      {modal && (
        <div className="modal d-block" style={{ background: "rgba(46,58,31,0.45)" }}
          onClick={() => setModal(null)}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-content p-4">
              <h5 className="fw-bold mb-1" style={{ color: "var(--ink)" }}>{modal.menu.menuName}</h5>
              <p className="text-muted small mb-3">{modal.menu.price?.toLocaleString()}원 · 옵션을 선택해주세요</p>

              {modal.groups.map((group) => (
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
                <button type="button" className="btn-res-outline"
                  style={{ flex: 1, padding: "10px", textAlign: "center" }}
                  onClick={() => setModal(null)}>취소</button>
                <button type="button" className="btn-res-success"
                  style={{ flex: 2, padding: "10px", textAlign: "center" }}
                  onClick={confirmModal}>장바구니 담기</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationUpdateForm;