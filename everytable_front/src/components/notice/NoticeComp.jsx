import { Routes, Route } from "react-router-dom";
import NoticeList from "./NoticeList";
import NoticeView from "./NoticeView";
import NoticeWrite from "./NoticeWrite";
import NoticeUpdate from "./NoticeUpdate";

function NoticeComp() {
  return (
    <Routes>
      <Route path="list" element={<NoticeList />} />
      <Route path="view" element={<NoticeView />} />
      <Route path="write" element={<NoticeWrite />} />
      <Route path="update" element={<NoticeUpdate />} />
    </Routes>
  );
}

export default NoticeComp;
