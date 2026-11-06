-- ==============================================
-- everytable 최종 스키마 (MariaDB, 현재 JPA 엔티티 기준)
-- ca0cdae(초기 팀 합의 스키마, Oracle 문법) 구조를 기반으로,
-- 이후 엔티티 리팩터링(필드명 id->no 통일, orders/store_cate/notice_cate 컬럼명 정리,
-- reservation.order_add/approve_deadline 추가)을 반영해 MariaDB 문법으로 다시 작성함.
-- ==============================================

DROP DATABASE IF EXISTS everytable;
CREATE DATABASE everytable DEFAULT CHARACTER SET utf8mb4;
USE everytable;

-- ==============================================
-- 1. 등급 마스터 (member보다 먼저 생성, grade_no: 1/2/9 고정값 - AUTO_INCREMENT 아님)
-- ==============================================
CREATE TABLE grade (
    grade_no   INT PRIMARY KEY,           -- 1:일반회원 2:매장점주 9:관리자
    grade_name VARCHAR(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- 2. 회원
-- ==============================================
CREATE TABLE member (
    member_no     BIGINT AUTO_INCREMENT PRIMARY KEY,
    id            VARCHAR(20)  NOT NULL UNIQUE,
    pw            VARCHAR(100) NOT NULL,
    name          VARCHAR(30)  NOT NULL,
    gender        VARCHAR(15),
    birth         DATE,
    tel           VARCHAR(13),
    email         VARCHAR(50)  NOT NULL,
    status        VARCHAR(10)  NOT NULL DEFAULT '정상',   -- 정상/휴면/정지/탈퇴/파기
    grade_no      INT          NOT NULL DEFAULT 1,
    join_date     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME,
    sus_end_date  DATE,
    withdraw_date      DATE,
    CONSTRAINT fk_member_grade FOREIGN KEY (grade_no) REFERENCES grade(grade_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- 3. 매장
-- ==============================================
CREATE TABLE store (
    store_no          BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_no          BIGINT,                       -- member.member_no 참조 (점주, grade_no=2)
    store_name        VARCHAR(100) NOT NULL,
    store_cate        INT,
    store_addr        VARCHAR(200),
    store_tel         VARCHAR(20),
    open_time         VARCHAR(50),
    min_order_price   INT NOT NULL DEFAULT 0,
    prepare_time      VARCHAR(50),
    filename          VARCHAR(4000),                -- 매장 이미지
    avg_rating        DOUBLE NOT NULL DEFAULT 0,
    review_count      INT NOT NULL DEFAULT 0,
    refund_policy_24  VARCHAR(100),                 -- 픽업 24시간 전 정책
    refund_policy_12  VARCHAR(100),                 -- 픽업 12시간 전 정책
    refund_policy_0   VARCHAR(100),                 -- 픽업 12시간 이내 정책
    CONSTRAINT fk_store_owner FOREIGN KEY (owner_no) REFERENCES member(member_no),
    CONSTRAINT fk_store_cate FOREIGN KEY (store_cate) REFERENCES store_cate(store_cate_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- 4. 매장 카테고리 마스터 (store.store_cate는 이 테이블을 FK로 참조하지 않고
--    카테고리 이름을 문자열로 직접 저장함 - 조회/관리용 참고 테이블)
-- ==============================================
CREATE TABLE store_cate (
    store_cate_no INT AUTO_INCREMENT PRIMARY KEY,
    cate_name     VARCHAR(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- 5. 메뉴
-- ==============================================
CREATE TABLE menu (
    menu_no        BIGINT AUTO_INCREMENT PRIMARY KEY,
    store_no       BIGINT NOT NULL,
    menu_name      VARCHAR(100) NOT NULL,
    price          INT NOT NULL,
    description    VARCHAR(500),
    image_url      VARCHAR(255),
    is_active      INT NOT NULL DEFAULT 1,           -- 1:판매중 0:품절
    created_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_menu_store FOREIGN KEY (store_no) REFERENCES store(store_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- 6. 메뉴 옵션 (예: 맵기 선택, 곱빼기 추가 등)
-- ==============================================
CREATE TABLE menu_option (
    option_no         BIGINT AUTO_INCREMENT PRIMARY KEY,
    menu_no           BIGINT NOT NULL,
    option_name       VARCHAR(30) NOT NULL,  -- 옵션명(ex. 온도, 사이즈)
    option_value      VARCHAR(30) NOT NULL,  -- 옵션값(ex. 핫/아이스, S/M/L)
    is_required		  TINYINT(1) NOT NULL DEFAULT 0,  -- 필수여부(필수:1, 선택:0)
    additional_price  INT NOT NULL,  -- 추가금
    CONSTRAINT fk_menu_option_menu FOREIGN KEY (menu_no) REFERENCES menu(menu_no) ON DELETE CASCADE,
    CONSTRAINT chk_menu_option_is_required CHECK (is_required IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

-- ==============================================
-- 8. 공지 카테고리 마스터 (notice_cate_no: 고정값 - AUTO_INCREMENT 아님)
-- ==============================================
CREATE TABLE notice_cate (
    notice_cate_no INT PRIMARY KEY,
    cate_name      VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- 9. 공지사항
-- ==============================================
CREATE TABLE notice (
    notice_no    BIGINT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(100) NOT NULL,
    content      VARCHAR(1000) NOT NULL,
    image        VARCHAR(100),
    admin_no     BIGINT NOT NULL,             -- member.member_no 참조 (작성자, 관리자)
    cate_no      INT NOT NULL,                -- notice_cate.notice_cate_no 참조
    write_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date  DATETIME,
    hit          BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_notice_admin FOREIGN KEY (admin_no) REFERENCES member(member_no),
    CONSTRAINT fk_notice_cate FOREIGN KEY (cate_no) REFERENCES notice_cate(notice_cate_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- 10. 예약 (res_status: 1=대기 2=승인 3=완료 4=취소, res_type: 단체/픽업)
-- ==============================================
CREATE TABLE reservation (
    res_no            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_no           BIGINT NOT NULL,
    store_no          BIGINT NOT NULL,
    res_date          DATE NOT NULL,
    res_time          VARCHAR(5),                 -- 'HH:mm'
    res_count         BIGINT NOT NULL,
    res_phone         VARCHAR(11) NOT NULL,       -- 하이픈 없는 숫자 11자리
    res_status        BIGINT NOT NULL DEFAULT 1,
    cancel_reason     VARCHAR(150),
    res_created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    res_type          VARCHAR(10) NOT NULL,       -- 단체/픽업
    total_price       BIGINT NOT NULL DEFAULT 0,
    order_add         VARCHAR(500),               -- 주최자 요청사항 (finalOrder 단계에서 세팅)
    approve_deadline  DATETIME,                   -- 점주 승인 기한
    CONSTRAINT fk_reservation_member FOREIGN KEY (user_no) REFERENCES member(member_no),
    CONSTRAINT fk_reservation_store FOREIGN KEY (store_no) REFERENCES store(store_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- 11. 주문 메뉴 (예약 1건에 여러 메뉴가 딸림, order_item에서 이름 변경됨)
-- ==============================================
CREATE TABLE orders (
    orders_no  BIGINT AUTO_INCREMENT PRIMARY KEY,
    res_no     BIGINT NOT NULL,
    menu_no    BIGINT NOT NULL,
    quantity   BIGINT NOT NULL,
    price      BIGINT,
    op         VARCHAR(1000),               -- 선택된 메뉴 옵션 문자열 (예: "사이즈=L,온도=아이스")
    adds       VARCHAR(200),                -- 추가 요청사항
    CONSTRAINT fk_orders_reservation FOREIGN KEY (res_no) REFERENCES reservation(res_no),
    CONSTRAINT fk_orders_menu FOREIGN KEY (menu_no) REFERENCES menu(menu_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- 12. 결제 (status: SUCCESS/FAIL/REFUNDED)
-- ==============================================
CREATE TABLE payment (
    payment_no   BIGINT AUTO_INCREMENT PRIMARY KEY,
    res_no       BIGINT NOT NULL,
    method       VARCHAR(20) NOT NULL,
    amount       BIGINT NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                 CONSTRAINT payment_status_chk CHECK (status IN ('PENDING', 'SUCCESS', 'FAIL', 'REFUNDED')),
    pay_date     DATETIME NOT NULL,
    update_date  DATETIME,
    pickup_date  DATETIME NOT NULL,
    CONSTRAINT fk_payment_reservation FOREIGN KEY (res_no) REFERENCES reservation(res_no)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

-- ==============================================
-- 13. 환불 (status: REQUESTED/COMPLETED/REJECTED)
-- ==============================================
CREATE TABLE refund (
    refund_no      BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_no     BIGINT NOT NULL,
    refund_rate    BIGINT NOT NULL,            -- 환불 비율
    refund_amount  BIGINT NOT NULL,            -- 실제 환불 금액
    refund_date    DATETIME NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'
                   CHECK (status IN ('REQUESTED', 'COMPLETED', 'REJECTED')),
    CONSTRAINT fk_refund_payment FOREIGN KEY (payment_no) REFERENCES payment(payment_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- 14. 리뷰
-- ==============================================
CREATE TABLE review (
    review_no   BIGINT AUTO_INCREMENT PRIMARY KEY,
    res_no      BIGINT NOT NULL UNIQUE,
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content     VARCHAR(500),
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_reservation FOREIGN KEY (res_no) REFERENCES reservation(res_no)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

-- ==============================================
-- 15. 정지 내역
-- ==============================================
CREATE TABLE suspension_history (
    sus_no      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_no     BIGINT NOT NULL,               -- 정지당한 회원
    start_date  DATETIME NOT NULL,
    end_date    DATE NOT NULL,
    reason      VARCHAR(1000),
    admin_no    BIGINT NOT NULL,               -- 정지 처리한 관리자
    CONSTRAINT fk_suspension_user FOREIGN KEY (user_no) REFERENCES member(member_no),
    CONSTRAINT fk_suspension_admin FOREIGN KEY (admin_no) REFERENCES member(member_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- 16. 탈퇴 회원 백업 (개인정보 파기 배치용)
-- ==============================================
CREATE TABLE withdrawn_member_backup (
    withdraw_no      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_no     BIGINT NOT NULL UNIQUE,
    join_date   DATE NOT NULL,
    withdraw_date    DATE NOT NULL,
    purge_date  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_withdrawn_user FOREIGN KEY (user_no) REFERENCES member(member_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
