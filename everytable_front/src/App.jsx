import { Routes, Route, useLocation } from "react-router-dom"
import TopNavi from "./components/common/TopNavi"
import Home from "./components/common/Home"
import MemberComp from "./components/member/MemberComp"
import MenuComp from "./components/menu/MenuComp"
import MenuViewModal from "./components/menu/MenuViewModal"
import NoticeComp from "./components/notice/NoticeComp"
import NoticeViewModal from "./components/notice/NoticeViewModal"
import ReservationComp from "./components/reservation/ReservationComp"
import PaymentComp from "./components/payment/PaymentComp"
import RefundComp from "./components/refund/RefundComp"
import ReviewComp from "./components/review/ReviewComp"
import StatsComp from "./components/stats/StatsComp"
import StoreComp from "./components/store/StoreComp"
import Footer from "./components/common/Footer"

function App() {
  const location = useLocation()
  // 공지 목록에서 클릭했을 때 NoticeList.jsx가 navigate(..., { state: { backgroundLocation } })로 넘겨준 "뒤에 그대로 보여줄 화면"의 위치.
  // 이 값이 있으면 실제 주소는 /notice/view?no=... 로 바뀌어도 아래 메인 Routes는 계속 배경 위치(목록)를 렌더링하고, 그 위에 모달만 겹쳐서 띄운다.
  // 주소를 직접 입력하거나 새로고침하면 이 state가 없으므로 NoticeComp의 view 라우트(전체 화면)로 빠진다.
  const backgroundLocation = location.state?.backgroundLocation
  // "/notice/view", "/menu/view" 주소일 때만 배경+모달 방식으로 렌더링.
  const modalPaths = ["/notice/view", "/menu/view"]
  const showModal = backgroundLocation && modalPaths.includes(location.pathname)

  return (
    <>
      <TopNavi />
      <div className="container pt-4 pb-5">
        <Routes location={showModal ? backgroundLocation : location}>
          <Route path="/" element={<Home />} />
          <Route path="/member/*" element={<MemberComp />} />
          <Route path="/menu/*" element={<MenuComp />} />
          <Route path="/notice/*" element={<NoticeComp />} />
          <Route path="/reservation/*" element={<ReservationComp />} />
          <Route path="/payment/*" element={<PaymentComp />} />
          <Route path="/refund/*" element={<RefundComp />} />
          <Route path="/review/*" element={<ReviewComp />} />
          <Route path="/store/*" element={<StoreComp />} />
          <Route path="/stats/*" element={<StatsComp />} />
          <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
        </Routes>

        {backgroundLocation && (
          <Routes>
            <Route path="/notice/view" element={<NoticeViewModal />} />
            <Route path="/menu/view" element={<MenuViewModal />} />
          </Routes>
        )}
      </div>
      <Footer/>
    </>
  )
}

export default App