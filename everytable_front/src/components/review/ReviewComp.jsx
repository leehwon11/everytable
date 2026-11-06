import { Routes, Route } from "react-router-dom";
import ReviewList from "./ReviewList";
import ReviewStoreList from "./ReviewStoreList";
import ReviewWriteForm from "./ReviewWriteForm";
import ReviewUpdateForm from "./ReviewUpdateForm";

function ReviewComp() {
  return (
    <Routes>
      <Route path="list" element={<ReviewList />} />
      <Route path="storeList" element={<ReviewStoreList />} />
      <Route path="writeForm" element={<ReviewWriteForm />} />
      <Route path="updateForm" element={<ReviewUpdateForm />} />
    </Routes>
  );
}

export default ReviewComp;
