USE everytable;

-- 등급 마스터 (member보다 먼저 있어야 함 - FK)
INSERT INTO grade (grade_no, grade_name) VALUES
    (1, '일반회원'),
    (2, '매장점주'),
    (9, '관리자')
ON DUPLICATE KEY UPDATE grade_name = VALUES(grade_name);

-- 공지 카테고리 마스터 (notice보다 먼저 있어야 함 - FK)
INSERT INTO notice_cate (notice_cate_no, cate_name) VALUES
    (1, '공지사항'),
    (2, '시스템'),
    (3, '이벤트'),
    (4, '업데이트')
ON DUPLICATE KEY UPDATE cate_name = VALUES(cate_name);

-- 관리자 계정 (id: admin / pw: 1111)
-- 해시는 BCryptPasswordEncoder(=python bcrypt)로 실제 생성해서 검증한 값입니다.
INSERT INTO member (id, pw, name, gender, birth, tel, email, status, grade_no)
VALUES ('admin', '$2b$10$3b8jM2isEabDnlLoNBA8lezkfG1TFcB9EBYWgudb7r/U8rZ03Mkni', '관리자', '선택안함', '1990-01-01', NULL, 'admin@everytable.local', '정상', 9)
ON DUPLICATE KEY UPDATE id = id;

-- 일반회원 (id: user1 / pw: 1111)
INSERT INTO member (id, pw, name, gender, birth, tel, email, status, grade_no)
VALUES ('user1', '$2b$10$3b8jM2isEabDnlLoNBA8lezkfG1TFcB9EBYWgudb7r/U8rZ03Mkni', '홍길동', '남자', '1995-05-05', '010-1234-5678', 'user1@everytable.local', '정상', 1)
ON DUPLICATE KEY UPDATE id = id;

-- 매장점주 (id: owner1 / pw: 1111) + 매장 1개 + 메뉴 2개
INSERT INTO member (id, pw, name, gender, birth, tel, email, status, grade_no)
VALUES ('owner1', '$2b$10$3b8jM2isEabDnlLoNBA8lezkfG1TFcB9EBYWgudb7r/U8rZ03Mkni', '김사장', '여자',
'1985-03-03', '010-9999-8888', 'owner1@everytable.local', '정상', 2)
ON DUPLICATE KEY UPDATE id = id;

-- 일반회원 (id: user2 / pw: 1111)
INSERT INTO member (id, pw, name, gender, birth, tel, email, status, grade_no)
VALUES ('user2', '$2b$10$3b8jM2isEabDnlLoNBA8lezkfG1TFcB9EBYWgudb7r/U8rZ03Mkni', '전우치', '남자',
'1992-02-02', '010-1111-2222', 'user2@everytable.local', '정상', 1)
ON DUPLICATE KEY UPDATE id = id;

-- 일반회원 (id: user3 / pw: 1111)
INSERT INTO member (id, pw, name, gender, birth, tel, email, status, grade_no)
VALUES ('user3', '$2b$10$3b8jM2isEabDnlLoNBA8lezkfG1TFcB9EBYWgudb7r/U8rZ03Mkni', '차보리', '여자',
'1999-09-09', '010-3333-4444', 'user3@everytable.local', '정상', 1)
ON DUPLICATE KEY UPDATE id = id;

-- 매장점주 (id: owner2 / pw: 1111) + 매장 1개 + 메뉴 2개
INSERT INTO member (id, pw, name, gender, birth, tel, email, status, grade_no)
VALUES ('owner2', '$2b$10$3b8jM2isEabDnlLoNBA8lezkfG1TFcB9EBYWgudb7r/U8rZ03Mkni', '박사장', '남자',
'1982-02-02', '010-9999-8888', 'owner2@everytable.local', '정상', 2)
ON DUPLICATE KEY UPDATE id = id;

-- 매장점주 (id: owner3 / pw: 1111) + 매장 1개 + 메뉴 2개
INSERT INTO member (id, pw, name, gender, birth, tel, email, status, grade_no)
VALUES ('owner3', '$2b$10$3b8jM2isEabDnlLoNBA8lezkfG1TFcB9EBYWgudb7r/U8rZ03Mkni', '이사장', '여자',
'1983-03-03', '010-6262-5757', 'owner3@everytable.local', '정상', 2)
ON DUPLICATE KEY UPDATE id = id;

-- 매장점주
INSERT INTO member (id, pw, name, gender, birth, tel, email, status, grade_no, join_date, last_login, sus_end_date, withdraw_date) VALUES
('owner4', '$2b$10$GLCHRnrftx18ArfYLnIZnul6GmBq/MJxwg2tnDJnNSJnXGSWJnLc.', '한상철', '남자', '1985-06-01', '01099990000', 'owner4@test.com', '정상', 2, '2026-05-01 09:00:00', '2026-07-21 08:00:00', NULL, NULL),
('owner5', '$2b$10$GLCHRnrftx18ArfYLnIZnul6GmBq/MJxwg2tnDJnNSJnXGSWJnLc.', '오유진', '여자', '1988-10-20', '01010101010', 'owner5@test.com', '정상', 2, '2026-05-05 09:30:00', '2026-07-22 07:50:00', NULL, NULL),
('owner6', '$2b$10$GLCHRnrftx18ArfYLnIZnul6GmBq/MJxwg2tnDJnNSJnXGSWJnLc.', '배진수', '남자', '1990-02-11', '01020202020', 'owner6@test.com', '정상', 2, '2026-05-12 10:10:00', '2026-07-20 21:00:00', NULL, NULL),
('owner7', '$2b$10$GLCHRnrftx18ArfYLnIZnul6GmBq/MJxwg2tnDJnNSJnXGSWJnLc.', '류지안', '여자', '1992-01-25', '01031313131', 'owner7@test.com', '정상', 2, '2026-05-18 13:20:00', '2026-07-19 15:00:00', NULL, NULL),
('owner8', '$2b$10$GLCHRnrftx18ArfYLnIZnul6GmBq/MJxwg2tnDJnNSJnXGSWJnLc.', '문석준', '남자', '1987-09-03', '01041414141', 'owner8@test.com', '정상', 2, '2026-05-22 08:50:00', '2026-07-18 10:30:00', NULL, NULL);


-- 매장 카테고리
INSERT INTO store_cate (store_cate_no, cate_name) VALUES (1, '한식'), (2, '일식'), (3, '중식'), (4, '양식'), (5, '카페'), (6, '기타');

-- 매장

INSERT INTO store (owner_no, store_name, store_cate, store_addr, store_tel, open_time,
min_order_price,prepare_time)
SELECT m.member_no, '모두의 한정식', '한식', '서울시 강남구', '02-000-0000', '11:00~21:00', 10000, '20분'
FROM member m
WHERE m.id = 'owner1'
  AND NOT EXISTS (SELECT 1 FROM store s WHERE s.owner_no = m.member_no);

INSERT INTO menu (store_no, menu_name, price, description, image_url, is_active)
SELECT s.store_no, '갈비탕', 18000, '국내산 소갈비로 진하게 우린 국물', NULL, 1
FROM store s JOIN member m ON s.owner_no = m.member_no
WHERE m.id = 'owner1'
  AND NOT EXISTS (SELECT 1 FROM menu WHERE store_no = s.store_no AND menu_name = '갈비탕');

INSERT INTO menu (store_no, menu_name, price, description, image_url, is_active)
SELECT s.store_no, '된장찌개', 9000, '집에서 먹던 그 맛', NULL, 1
FROM store s JOIN member m ON s.owner_no = m.member_no
WHERE m.id = 'owner1'
  AND NOT EXISTS (SELECT 1 FROM menu WHERE store_no = s.store_no AND menu_name = '된장찌개');

-- 공지사항 샘플 (작성자: admin)
INSERT INTO notice (title, content, admin_no, cate_no)
SELECT '서비스 오픈 안내', 'everytable 서비스가 오픈되었습니다. 많은 이용 부탁드립니다.', m.member_no, 1
FROM member m
WHERE m.id = 'admin'
  AND NOT EXISTS (SELECT 1 FROM notice WHERE title = '서비스 오픈 안내');

INSERT INTO notice (title, content, admin_no, cate_no)
SELECT '정기 점검 안내', '매주 화요일 새벽 2시~4시 서버 정기 점검이 진행됩니다.', m.member_no, 2
FROM member m
WHERE m.id = 'admin'
  AND NOT EXISTS (SELECT 1 FROM notice WHERE title = '정기 점검 안내');

INSERT INTO notice (title, content, image, admin_no, cate_no, write_date, update_date, hit) VALUES
('서비스 오픈 안내', '에브리테이블 서비스가 정식 오픈되었습니다. 많은 이용 부탁드립니다.', NULL, 1, 1, '2026-06-01 09:00:00', '2026-06-01 09:00:00', 132),
('개인정보처리방침 개정 안내', '개인정보처리방침이 2026년 6월 5일자로 개정됩니다. 자세한 내용은 본문을 확인해주세요.', NULL, 1, 1, '2026-06-05 10:30:00', '2026-06-05 10:30:00', 87),
('서버 정기 점검 안내 (6/10)', '6월 10일 02:00~04:00 서버 정기 점검이 진행됩니다. 해당 시간 서비스 이용이 제한됩니다.', NULL, 1, 2, '2026-06-08 14:00:00', '2026-06-08 14:00:00', 54),
('결제 시스템 오류 수정 완료', '일부 사용자에게 발생하던 결제 오류가 수정되었습니다.', NULL, 1, 2, '2026-06-09 11:20:00', '2026-06-09 11:20:00', 41),
('여름맞이 단체주문 이벤트', '7~8월 단체주문 시 전 매장 5% 할인 이벤트를 진행합니다.', NULL, 1, 3, '2026-06-12 09:00:00', '2026-06-12 09:00:00', 210),
('신규 매장 입점 안내', '이번 달 신규 매장 12곳이 추가로 입점했습니다.', NULL, 1, 1, '2026-06-15 13:40:00', '2026-06-15 13:40:00', 76),
('앱 UI 개선 업데이트', '예약/결제 화면 UI가 더 편리하게 개선되었습니다.', NULL, 1, 4, '2026-06-18 16:10:00', '2026-06-18 16:10:00', 63),
('환불 정책 변경 안내', '7월 1일부터 환불 정책이 일부 변경됩니다. 반드시 확인 부탁드립니다.', NULL, 1, 1, '2026-06-20 10:00:00', '2026-06-20 10:00:00', 189),
('추석 연휴 운영 안내', '추석 연휴 기간 매장별 운영시간이 상이할 수 있습니다.', NULL, 1, 1, '2026-06-22 09:30:00', '2026-06-22 09:30:00', 98),
('그룹 주문 취합 기능 추가', '단체 주문 시 참여자별 메뉴를 한눈에 취합해서 볼 수 있는 기능이 추가되었습니다.', NULL, 1, 4, '2026-06-25 15:00:00', '2026-06-25 15:00:00', 145),
('앱 접속 지연 현상 안내', '일시적으로 접속 지연이 발생했습니다. 현재는 정상화되었습니다.', NULL, 1, 2, '2026-06-28 08:15:00', '2026-06-28 08:15:00', 33),
('리뷰 이벤트 당첨자 발표', '지난달 진행된 리뷰 작성 이벤트 당첨자를 발표합니다.', NULL, 1, 3, '2026-07-01 09:00:00', '2026-07-01 09:00:00', 267),
('매장 검색 기능 개선', '카테고리별 매장 검색이 더 빨라졌습니다.', NULL, 1, 4, '2026-07-03 11:00:00', '2026-07-03 11:00:00', 58),
('공지사항 게시판 오픈', '앞으로 서비스 관련 소식은 이 게시판을 통해 안내드립니다.', NULL, 1, 1, '2026-07-05 09:00:00', '2026-07-05 09:00:00', 172),
('최소 주문금액 정책 안내', '매장별 최소 주문금액 기준이 상이하니 예약 전 꼭 확인해주세요.', NULL, 1, 1, '2026-07-08 10:00:00', '2026-07-08 10:00:00', 121),
('결제 수단 추가 (계좌이체)', '신용카드에 이어 계좌이체 결제가 추가되었습니다.', NULL, 1, 4, '2026-07-10 14:30:00', '2026-07-10 14:30:00', 94),
('여름 휴가철 예약 폭주 안내', '휴가철 예약이 몰릴 수 있어 여유있게 예약해주세요.', NULL, 1, 1, '2026-07-13 09:00:00', '2026-07-13 09:00:00', 156),
('점주 대상 정산 안내', '이번 달 정산 내역이 매장 관리 페이지에서 확인 가능합니다.', NULL, 1, 1, '2026-07-16 09:00:00', '2026-07-16 09:00:00', 47),
('앱 다크모드 지원 예정', '다음 업데이트에서 다크모드가 추가될 예정입니다.', NULL, 1, 3, '2026-07-19 13:00:00', '2026-07-19 13:00:00', 203),
('7월 시스템 점검 예고', '7월 25일 새벽 시스템 점검이 예정되어 있습니다.', NULL, 1, 2, '2026-07-21 10:00:00', '2026-07-21 10:00:00', 11);