package com.everytable.api.refund.service;

import com.everytable.api.refund.vo.RefundVO;
import com.everytable.api.util.page.PageObject;

import java.util.List;
import java.util.Map;

public interface RefundService {

    // 1. 환불 신청 폼에 필요한 계산값 (결제정보 + 환불비율 + 환불금액)
    Map<String, Object> refundForm(Long paymentId, Long requesterNo, boolean isAdmin);

    // 2. 환불 신청 (status=REQUESTED)
    int refund(Long orderId, Long userNo, Long paymentId, Long refundRate, Long refundAmount, String reason);

    // 3. [추가] 관리자 환불 승인/거절 처리 (status=COMPLETED/REJECTED)
    int updateStatus(Long refundNo, String status);

    // 4. [추가] 환불 목록/상세 조회
    List<RefundVO> list(PageObject pageObject);
    RefundVO view(Long refundNo);
}