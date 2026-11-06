import { Routes, Route } from "react-router-dom";
import RefundForm from "./RefundForm";

function RefundComp() {
  return (
    <Routes>
      <Route path="refundForm" element={<RefundForm />} />
    </Routes>
  );
}

export default RefundComp;
