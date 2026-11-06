package com.everytable.api.reservation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * orders 테이블 JPA 엔티티 (MariaDB 최종 스키마 기준)
 *
 * 스키마 변경사항 (servlet -> springboot):
 *   - 테이블명: order_item -> orders
 *   - PK 컬럼명: order_item_no -> orders_no
 *   - 신규 컬럼: op(메뉴 옵션 문자열), adds(추가 요청사항)
 *
 * 자바 필드명도 ordersNo로 통일해서 컬럼명과 그대로 일치하므로 @Column(name=...) 불필요.
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "orders")
public class Orders {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ordersNo;

    @Column(nullable = false)
    private Long resNo;

    @Column(nullable = false)
    private Long menuNo;

    @Column(nullable = false)
    private Long quantity;

    private Long price;

    /** 선택된 메뉴 옵션 문자열 (예: "사이즈=L,온도=아이스") */
    @Column(length = 1000)
    private String op;

    /** 추가 요청사항 */
    @Column(length = 200)
    private String adds;
}
