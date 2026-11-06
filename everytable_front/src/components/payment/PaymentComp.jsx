import { Routes, Route } from "react-router-dom";
import PaymentWriteForm from "./PaymentWriteForm";
import PaymentList from "./PaymentList";
import PaymentView from "./PaymentView";
import PaymentUpdateForm from "./PaymentUpdateForm";

function PaymentComp() {
  return (
    <Routes>
      <Route path="writeForm" element={<PaymentWriteForm />} />
      <Route path="list" element={<PaymentList />} />
      <Route path="view" element={<PaymentView />} />
      <Route path="updateForm" element={<PaymentUpdateForm />} />
    </Routes>
  );
}

export default PaymentComp;