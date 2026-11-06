package com.everytable.api.payment.vo;

import lombok.Data;

// 원본 everytable.payment.vo.PaymentVO 이식 (snake_case -> camelCase 정리)
@Data
public class PaymentVO {
    private Long paymentNo;
    private Long orderNo;      // reservation.res_no
    private Long userNo;
    private String userName;
    private Long storeNo;
    private String method;
    private Long amount;
    private String status;
    private String payDate;
    private String updateDate;
    private String pickupDate;
    private Long resStatus;      // 예약 상태
    private String cancelReason; // 취소 거절 사유 등
}
