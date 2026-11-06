import { Routes, Route } from "react-router-dom";
import StoreList from "./StoreList";
import StoreView from "./StoreView";
import StoreWrite from "./StoreWrite";
import StoreUpdate from "./StoreUpdate";
import MyStoreList from "./MyStoreList";

function StoreComp() {
  return (
    <Routes>
      <Route path="list" element={<StoreList />} />
      <Route path="view" element={<StoreView />} />
      <Route path="write" element={<StoreWrite />} />
      <Route path="update" element={<StoreUpdate />} />
      <Route path="myList" element={<MyStoreList />} />
    </Routes>
  );
}

export default StoreComp;