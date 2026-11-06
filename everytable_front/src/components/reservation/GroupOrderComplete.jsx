import "./reservation.css";

// 원본 reservation/groupOrderComplete.jsp 이식 - 참여자 메뉴 선택 완료 안내 (로그인 불필요)
function GroupOrderComplete() {
  return (
    <div className="group-share-card">
      <div className="group-complete-icon">✅</div>
      <h3 className="mb-2">메뉴 주문이 완료되었습니다</h3>
      <p className="text-muted">
        주최자가 전체 주문을 취합하여 결제를 진행합니다.
        <br />이 창은 닫으셔도 됩니다.
      </p>
    </div>
  );
}

export default GroupOrderComplete;
