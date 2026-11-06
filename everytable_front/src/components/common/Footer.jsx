function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="footer-left">
          <div className="footer-top">
            <span className="footer-brand">everytable</span>
            <span className="footer-slogan">단체 예약의 새로운 기준</span>
          </div>

          <ul className="footer-info-list">
            <li><span className="footer-info-label">상호</span>everytable</li>
            <li><span className="footer-info-label">대표</span>everytable 팀</li>
            <li><span className="footer-info-label">사업자등록번호</span>000-00-00000</li>
            <li><span className="footer-info-label">고객문의</span>everytablereactspringboot0715@gmail.com</li>
            <li><span className="footer-info-label">운영시간</span>평일 09:00 ~ 18:00 (주말·공휴일 휴무)</li>
          </ul>
        </div>

        <div className="footer-right">
          <span className="footer-policy-title">개인정보처리방침</span>
          <p className="footer-policy-text">
            everytable은 예약·주문 서비스 제공을 위해 이름, 연락처 등 최소한의
            개인정보만 수집하며, 목적 달성 후 관련 법령에 따라 안전하게 파기합니다.
          </p>
        </div>
      </div>

      <p className="footer-copy">
        &copy; {year} everytable. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;