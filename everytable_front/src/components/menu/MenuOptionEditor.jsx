import { useState } from "react";

/**
 * 점주용 메뉴 옵션 편집기.
 * isMultiple: 복수 선택 허용 여부 추가
 * groups: [ { optionName, isRequired, isMultiple, values: [{optionValue, additionalPrice}] } ]
 */
function MenuOptionEditor({ groups, onChange }) {
  const [newGroupName, setNewGroupName] = useState("");

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) { alert("옵션 그룹명을 입력해주세요."); return; }
    if (groups.some((g) => g.optionName === name)) { alert("이미 있는 그룹명입니다."); return; }
    onChange([...groups, {
      optionName: name,
      isRequired: 0,
      isMultiple: 0,
      values: [{ optionValue: "", additionalPrice: 0 }]
    }]);
    setNewGroupName("");
  };

  const removeGroup = (idx) => onChange(groups.filter((_, i) => i !== idx));

  const updateGroup = (idx, field, value) =>
    onChange(groups.map((g, i) => i === idx ? { ...g, [field]: value } : g));

  const addValue = (gIdx) =>
    onChange(groups.map((g, i) =>
      i === gIdx ? { ...g, values: [...g.values, { optionValue: "", additionalPrice: 0 }] } : g
    ));

  const removeValue = (gIdx, vIdx) =>
    onChange(groups.map((g, i) =>
      i === gIdx ? { ...g, values: g.values.filter((_, vi) => vi !== vIdx) } : g
    ));

  const updateValue = (gIdx, vIdx, field, value) =>
    onChange(groups.map((g, i) =>
      i === gIdx
        ? { ...g, values: g.values.map((v, vi) => vi === vIdx ? { ...v, [field]: value } : v) }
        : g
    ));

  return (
    <div>
      {groups.length === 0 && (
        <p className="text-muted small mb-2">옵션이 없습니다. 아래에서 그룹을 추가하세요.</p>
      )}

      {groups.map((group, gIdx) => (
        <div key={gIdx} className="border rounded p-3 mb-3" style={{ background: "#fafafa" }}>
          {/* 그룹 헤더 */}
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-grow-1 me-2">
              <input
                type="text" className="form-control form-control-sm mb-2"
                placeholder="옵션 그룹명 (예: 사이즈, 맵기, 온도)"
                value={group.optionName}
                onChange={(e) => updateGroup(gIdx, "optionName", e.target.value)}
              />
              <div className="d-flex gap-3">
                <label className="small mb-0 d-flex align-items-center gap-1" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={group.isRequired === 1}
                    onChange={(e) => updateGroup(gIdx, "isRequired", e.target.checked ? 1 : 0)} />
                  <span>필수 선택</span>
                </label>
                <label className="small mb-0 d-flex align-items-center gap-1" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={group.isMultiple === 1}
                    onChange={(e) => updateGroup(gIdx, "isMultiple", e.target.checked ? 1 : 0)} />
                  <span>복수 선택 허용</span>
                </label>
              </div>
            </div>
            <button type="button" className="btn btn-sm btn-outline-danger"
              onClick={() => removeGroup(gIdx)}>삭제</button>
          </div>

          {/* 옵션 값 목록 */}
          <div className="small text-muted mb-2">옵션 값 목록</div>
          {group.values.map((val, vIdx) => (
            <div key={vIdx} className="d-flex align-items-center gap-2 mb-2">
              <input type="text" className="form-control form-control-sm"
                placeholder={`옵션 값 (예: ${gIdx === 0 ? "S / M / L" : "순한맛 / 보통 / 매운맛"})`}
                value={val.optionValue}
                onChange={(e) => updateValue(gIdx, vIdx, "optionValue", e.target.value)} />
              <input type="number" className="form-control form-control-sm" style={{ maxWidth: 120 }}
                placeholder="추가금액 (원, 없으면 0)"
                min={0} value={val.additionalPrice}
                onChange={(e) => updateValue(gIdx, vIdx, "additionalPrice", Number(e.target.value))} />
              <button type="button" className="btn btn-sm btn-outline-secondary"
                onClick={() => removeValue(gIdx, vIdx)}
                disabled={group.values.length === 1}>×</button>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline-primary mt-1"
            onClick={() => addValue(gIdx)}>+ 옵션 값 추가</button>
        </div>
      ))}

      {/* 새 그룹 추가 */}
      <div className="d-flex gap-2 mt-1">
        <input type="text" className="form-control form-control-sm"
          placeholder="새 옵션 그룹명 입력 (예: 곱빼기, 추가 토핑)"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGroup())} />
        <button type="button" className="btn btn-sm btn-outline-dark" style={{ whiteSpace: "nowrap" }}
          onClick={addGroup}>+ 그룹 추가</button>
      </div>
    </div>
  );
}

export default MenuOptionEditor;