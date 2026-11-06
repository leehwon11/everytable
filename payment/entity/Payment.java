package com.everytable.api.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 원본 everytable.payment.vo.PaymentVO + payment 테이블 이식.
 *
 * 팀 최종 스키마 반영: payment 테이블에서 order_id/user_id/store_id 컬럼이 모두 사라지고
 * res_no(reservation FK) 하나만 남았다. user_id/store_id는 이제 payment.res_no ->
 * reservation.user_no/store_no 를 조인해서 구해야 한다 (PaymentServiceImpl 참고).
 * PaymentVO의 orderId/userId/storeId 필드명 자체는 프론트엔드 호환을 위해 그대로 유지했다.
 *
 * status: 스키마 CHECK 제약으로 SUCCESS/FAIL/REFUNDED 3개 값만 허용된다(원본의 CANCEL/REJECTED는
 * 더 이상 허용되지 않음 - PaymentServiceImpl.cancel()이 REFUNDED로 대체 처리하도록 바꿨다).
 * pickup_date도 이제 NOT NULL이라 항상 값을 채워야 한다.
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentNo;

    // reservation.res_no 참조
    @Column(nullable = false)
    private Long resNo;

    @Column(nullable = false, length = 20)
    private String method;

    @Column(nullable = false)
    private Long amount;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "SUCCESS";

    @Column(nullable = false)
    private LocalDateTime payDate;

    private LocalDateTime updateDate;

    @Column(nullable = false)
    private LocalDateTime pickupDate;
}
