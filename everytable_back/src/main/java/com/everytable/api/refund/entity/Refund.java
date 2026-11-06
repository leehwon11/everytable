package com.everytable.api.refund.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 원본 everytable.refund.vo.RefundVO + refund 테이블 이식.
 *
 * 팀 최종 스키마 반영: refund 테이블에서 order_id/user_id/reason 컬럼이 모두 빠지고
 * refund_no/payment_no/refund_rate/refund_amount/refund_date/status만 남았다.
 * order_id/user_id/reason은 원본에도 환불 내역을 다시 조회/표시하는 화면이 없어서(환불 신청 폼과
 * 결과 응답에만 쓰였음) DB에 저장되지 않아도 실제 기능상 영향은 없다 - RefundServiceImpl 참고.
 * status: 스키마 CHECK 제약으로 REQUESTED/COMPLETED/REJECTED 3개 값만 허용된다.
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "refund")
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long refundNo;

    @Column(nullable = false)
    private Long paymentNo;

    @Column(nullable = false)
    private Long refundRate; // 100 또는 50 (%)

    @Column(nullable = false)
    private Long refundAmount;

    @Column(nullable = false)
    private LocalDateTime refundDate;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "REQUESTED";
}
