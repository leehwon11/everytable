import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./reservation.css";

const SHARE_METHODS = [
  { key: "message", icon: "💬", label: "메시지" },
  { key: "kakao",   icon: "🟡", label: "카카오톡" },
  { key: "email",   icon: "📧", label: "이메일" },
];

function GroupShare() {
  const [searchParams] = useSearchParams();
  const resNo   = searchParams.get("resNo");
  const storeId = searchParams.get("storeId");
  const inputRef = useRef(null);
  const [showModal, setShowModal] = useState(false);

  const shareUrl = `${window.location.origin}/reservation/groupMenuForm?resNo=${resNo}`;

  const handleShare = (method) => {
    setShowModal(false);
    const labels = { message: "메시지", kakao: "카카오톡", email: "이메일" };
    alert(`${labels[method]}로 공유 링크를 전송하였습니다.`);
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("링크가 복사되었습니다! 팀원들에게 공유해주세요.");
    } catch {
      inputRef.current?.select();
      document.execCommand("copy");
      alert("링크가 복사되었습니다!");
    }
  };

  return (
    <div className="group-share-card">
      <div style={{ fontSize: 40, marginBottom: 8 }}>🔗</div>
      <h3 className="mb-2">단체 주문 링크 공유</h3>
      <p className="text-muted mb-3">
        아래 링크를 팀원들에게 공유하세요.
        <br />
        <span className="small">팀원들이 각자 메뉴를 선택하면 여기서 취합할 수 있습니다.</span>
      </p>

      <input ref={inputRef} type="text" className="form-control text-center"
        style={{ marginBottom: 4 }}
        value={shareUrl} readOnly onClick={(e) => e.target.select()} />

      <button className="btn-res-success" style={{ width: "100%", marginTop: 16, marginBottom: 8, padding: "12px", fontSize: 15, textAlign: "center" }}
        onClick={() => setShowModal(true)}>
        📤 공유하기
      </button>
      <button className="btn-res-outline" style={{ width: "100%", marginBottom: 12, padding: "12px", textAlign: "center" }} onClick={copyUrl}>
        📋 링크 직접 복사
      </button>

      <Link to={`/reservation/groupOrderStatus?resNo=${resNo}&storeId=${storeId}`}
        className="btn-res-outline" style={{ width: "100%", display: "block", padding: "12px", textAlign: "center" }}>
        취합 현황 보기 →
      </Link>

      {/* 공유 방법 선택 모달 */}
      {showModal && (
        <div className="modal d-block" style={{ background: "rgba(46,58,31,0.45)" }}
          onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 320 }}
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-content p-4">
              <h5 className="fw-bold mb-1 text-center">공유 방법 선택</h5>
              <p className="text-muted small text-center mb-3">어떤 방법으로 링크를 공유할까요?</p>
              <div className="d-flex justify-content-center gap-4 mb-3">
                {SHARE_METHODS.map((m) => (
                  <button key={m.key}
                    className="d-flex flex-column align-items-center gap-1 px-3 py-3"
                    style={{ minWidth: 72, borderRadius: 12, border: "1px solid var(--border)", background: "var(--cream)" }}
                    onClick={() => handleShare(m.key)}>
                    <span style={{ fontSize: 28 }}>{m.icon}</span>
                    <span className="small fw-bold" style={{ color: "var(--ink)" }}>{m.label}</span>
                  </button>
                ))}
              </div>
              <button className="btn-res-outline" style={{ width: "100%", padding: "8px", fontSize: 13 }}
                onClick={() => setShowModal(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupShare;
