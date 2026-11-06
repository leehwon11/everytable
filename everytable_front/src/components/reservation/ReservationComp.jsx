import { Routes, Route } from "react-router-dom";
import ReservationList from "./ReservationList";
import ReservationView from "./ReservationView";
import ReservationWriteForm from "./ReservationWriteForm";
import ReservationUpdateForm from "./ReservationUpdateForm";
import ReservationAdminList from "./ReservationAdminList";
import ReservationAdminView from "./ReservationAdminView";
import GroupShare from "./GroupShare";
import GroupMenuForm from "./GroupMenuForm";
import GroupOrderStatus from "./GroupOrderStatus";
import GroupOrderComplete from "./GroupOrderComplete";

function ReservationComp() {
  return (
    <Routes>
      <Route path="list"              element={<ReservationList />} />
      <Route path="view"              element={<ReservationView />} />
      <Route path="writeForm"         element={<ReservationWriteForm />} />
      <Route path="updateForm"        element={<ReservationUpdateForm />} />
      <Route path="adminList"         element={<ReservationAdminList />} />
      <Route path="adminView"         element={<ReservationAdminView />} />
      <Route path="groupShare"        element={<GroupShare />} />
      <Route path="groupMenuForm"     element={<GroupMenuForm />} />
      <Route path="groupOrderStatus"  element={<GroupOrderStatus />} />
      <Route path="groupOrderComplete" element={<GroupOrderComplete />} />
    </Routes>
  );
}

export default ReservationComp;
