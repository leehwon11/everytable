package com.everytable.api.refund.vo;

import lombok.Data;

// 원본 everytable.refund.vo.RefundVO 이식
@Data
public class RefundVO {
    private Long refundNo;
    private Long orderNo;
    private Long userNo;
    private Long paymentNo;
    private Long refundRate;
    private Long refundAmount;
    private String reason;
    private String refundDate;
    private String status;
}
