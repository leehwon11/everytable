import { Routes, Route } from "react-router-dom";
import MemberLogin from "./MemberLogin";
import MemberWrite from "./MemberWrite";
import MemberView from "./MemberView";
import MemberFindId from "./MemberFindId";
import MemberFindPw from "./MemberFindPw";
import MemberList from "./MemberList";
import MemberInfo from "./MemberInfo";

function MemberComp() {
  return (
    <Routes>
      <Route path="login" element={<MemberLogin />} />
      <Route path="write" element={<MemberWrite />} />
      <Route path="view" element={<MemberView />} />
      <Route path="find-id" element={<MemberFindId />} />
      <Route path="find-pw" element={<MemberFindPw />} />
      {/* 관리자 회원관리 (member/list.jsp, member/memberInfo.jsp 대응 - 원본엔 있었지만 빠져 있던 화면) */}
      <Route path="list" element={<MemberList />} />
      <Route path="info" element={<MemberInfo />} />
    </Routes>
  );
}

export default MemberComp;
