import { Routes, Route } from "react-router-dom";
import MenuList from "./MenuList";
import MenuView from "./MenuView";
import MenuWrite from "./MenuWrite";
import MenuUpdate from "./MenuUpdate";

function MenuComp() {
  return (
    <Routes>
      <Route path="list" element={<MenuList />} />
      <Route path="view" element={<MenuView />} />
      <Route path="write" element={<MenuWrite />} />
      <Route path="update" element={<MenuUpdate />} />
    </Routes>
  );
}

export default MenuComp;