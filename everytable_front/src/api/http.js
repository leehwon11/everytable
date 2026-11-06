import axios from "axios";

// Spring Boot 백엔드 주소 (application.properties의 server.port=80과 일치해야 함)
export const API_BASE = "http://localhost:80";

// 인증 토큰(X-AUTH-TOKEN)을 매번 수동으로 붙이지 않도록 공용 axios 인스턴스를 하나 둔다.
// (참고 프로젝트 webjjang_front는 컴포넌트마다 axios.post(...)를 직접 호출했지만,
//  이 프로젝트는 로그인 후 관리자/점주 전용 API 호출이 많아 인터셉터로 정리했다.)
//
// withCredentials: true 는 휴면계정 인증/비밀번호 찾기(sendAuthCode.do -> verifyAuthCode.do -> resetPw.do)
// 처럼 백엔드가 HttpSession으로 상태를 기억하는 API에 세션 쿠키(JSESSIONID)가 실려가도록 하기 위해 필요하다.
// (백엔드 MemberRestController도 @CrossOrigin(allowCredentials = "true")로 맞춰져 있어야 동작한다.)
const http = axios.create({ baseURL: API_BASE, withCredentials: true });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["X-AUTH-TOKEN"] = token;
  return config;
});

export default http;
