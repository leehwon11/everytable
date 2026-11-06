package com.everytable.api.payment.service;

import com.everytable.api.payment.vo.PaymentVO;
import com.everytable.api.util.page.PageObject;

import java.util.List;

public interface PaymentService {

    List<PaymentVO> list(PageObject pageObject, String enforcedUserId);

    PaymentVO view(Long paymentId);

    // 유저: 결제 수단 등록 (초기 상태 PENDING)[cite: 16]
    PaymentVO write(PaymentVO vo);

    int update(Long paymentId, String status);

    int cancel(Long paymentId);

    // 점주 승인 시 자동 결제 처리 (PENDING -> SUCCESS)[cite: 15, 16]
    void approveByResNo(Long resNo);

    // 취소 승인 시 자동 환불 처리 (SUCCESS -> REFUNDED / PENDING -> FAIL)[cite: 15, 16]
    void refundByResNo(Long resNo);

    // 예약 정보 수정 시 결제 금액 및 픽업 일시 갱신
    void updatePaymentByResNo(Long resNo, Long amount, String pickupDate);

    Long todaySalesSum(List<Long> storeNos);

    Long todayOrderCount(List<Long> storeNos);
}