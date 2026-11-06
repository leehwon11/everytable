package com.everytable.api.reservation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * reservation 테이블 JPA 엔티티 (MariaDB 최종 스키마 기준)
 *
 * 주요 스키마 변경사항 (servlet -> springboot):
 *   - user_id(String) -> user_no(BIGINT, member.member_no FK)
 *   - store_id        -> store_no (BIGINT, store.store_no FK)
 *   - res_phone       -> VARCHAR(11), 하이픈 없는 숫자만
 *   - approve_deadline 컬럼 추가
 *
 * res_status 값:
 *   1: 대기(매장 확인 중), 2: 승인(예약 확정), 3: 완료(이용 완료), 4: 취소/거절
 * res_type 값:
 *   "단체" (단체 방문), "픽업" (포장/픽업)
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "reservation")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long resNo;

    /** member.member_no FK */
    @Column(nullable = false)
    private Long userNo;

    /** store.store_no FK */
    @Column(nullable = false)
    private Long storeNo;

    @Column(nullable = false)
    private LocalDate resDate;

    /** HH:mm 형식 (5자리) */
    @Column(length = 5)
    private String resTime;

    @Column(nullable = false)
    private Long resCount;

    /** 하이픈 없는 숫자 11자리 (예: 01012345678) */
    @Column(length = 11, nullable = false)
    private String resPhone;

    /** 1: 대기, 2: 승인, 3: 완료, 4: 취소 */
    @Builder.Default
    @Column(nullable = false)
    private Long resStatus = 1L;

    @Column(length = 150)
    private String cancelReason;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime resCreatedAt;

    /** "단체" 또는 "픽업" */
    @Column(length = 10, nullable = false)
    private String resType;

    @Builder.Default
    @Column(nullable = false)
    private Long totalPrice = 0L;

    /** 주최자 요청사항 (finalOrder 단계에서 세팅) */
    @Column(length = 500)
    private String orderAdd;

    /** 점주 승인 기한 (신규 컬럼) */
    private LocalDateTime approveDeadline;
}
