package com.everytable.api.refund.service;

import com.everytable.api.payment.entity.Payment;
import com.everytable.api.payment.repository.PaymentRepository;
import com.everytable.api.payment.service.PaymentService;
import com.everytable.api.payment.vo.PaymentVO;
import com.everytable.api.refund.entity.Refund;
import com.everytable.api.refund.repository.RefundRepository;
import com.everytable.api.refund.vo.RefundVO;
import com.everytable.api.reservation.repository.ReservationRepository;
import com.everytable.api.store.entity.Store;
import com.everytable.api.store.repository.StoreRepository;
import com.everytable.api.util.page.PageObject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final RefundRepository      refundRepository;
    private final PaymentRepository     paymentRepository;
    private final PaymentService        paymentService;
    private final StoreRepository       storeRepository;
    private final ReservationRepository reservationRepository;

    @Override
    public Map<String, Object> refundForm(Long paymentId, Long requesterNo, boolean isAdmin) {
        PaymentVO payment = paymentService.view(paymentId);
        if (!isAdmin && !payment.getUserNo().equals(requesterNo)) {
            throw new RuntimeException("본인의 결제만 환불 신청할 수 있습니다.");
        }

        // 💡 [핵심 추가 1] 환불 신청 폼 진입 시점에 점주가 취소 거절했던 건인지 미리 체크하여 차단
        Payment paymentEntity = paymentRepository.findById(paymentId).orElse(null);
        if (paymentEntity != null && paymentEntity.getResNo() != null) {
            reservationRepository.findById(paymentEntity.getResNo()).ifPresent(reservation -> {
                if (reservation.getResStatus() == 2L && reservation.getCancelReason() != null && !reservation.getCancelReason().isEmpty()) {
                    throw new RuntimeException("점주가 취소를 거절한 예약은 환불 신청을 할 수 없습니다.");
                }
            });
        }

        if (payment.getPickupDate() == null) {
            throw new RuntimeException("픽업 예정일 정보가 없어 환불 신청이 불가능합니다.");
        }

        LocalDateTime pickup = LocalDateTime.parse(payment.getPickupDate(), DATETIME_FMT);
        long diffHours = Duration.between(LocalDateTime.now(), pickup).toHours();

        long rate;
        String policyNotice = "";

        Store store = payment.getStoreNo() != null ? storeRepository.findById(payment.getStoreNo()).orElse(null) : null;

        if (diffHours >= 24) {
            rate = 100;
            policyNotice = store != null && store.getRefundPolicy24() != null ? store.getRefundPolicy24() : "픽업 24시간 이전 (100% 환불)";
        } else if (diffHours >= 12) {
            rate = 50;
            policyNotice = store != null && store.getRefundPolicy12() != null ? store.getRefundPolicy12() : "픽업 12~24시간 전 (50% 환불)";
        } else {
            policyNotice = store != null && store.getRefundPolicy0() != null ? store.getRefundPolicy0() : "픽업 12시간 이내 (환불 불가)";
            throw new RuntimeException("픽업 12시간 이내라 환불 신청이 불가능합니다. (" + policyNotice + ")");
        }

        long refundAmount = payment.getAmount() * rate / 100;

        Map<String, Object> result = new HashMap<>();
        result.put("vo", payment);
        result.put("refundRate", rate);
        result.put("refundAmount", refundAmount);
        result.put("diffHours", diffHours);
        result.put("policyNotice", policyNotice);
        return result;
    }

    @Override
    @Transactional
    public int refund(Long orderId, Long userNo, Long paymentId, Long refundRate, Long refundAmount, String reason) {
        // 💡 [핵심 추가 2] 환불 신청 실행 시점에도 점주가 취소 거절했던 건인지 한 번 더블체크
        Payment payment = paymentRepository.findById(paymentId).orElse(null);
        if (payment != null && payment.getResNo() != null) {
            reservationRepository.findById(payment.getResNo()).ifPresent(reservation -> {
                if (reservation.getResStatus() == 2L && reservation.getCancelReason() != null && !reservation.getCancelReason().isEmpty()) {
                    throw new RuntimeException("점주가 취소를 거절한 예약은 다시 환불 신청할 수 없습니다.");
                }
            });
        }

        Refund refund = Refund.builder()
                .paymentNo(paymentId)
                .refundRate(refundRate)
                .refundAmount(refundAmount)
                .refundDate(LocalDateTime.now())
                .status("REQUESTED")
                .build();
        refundRepository.save(refund);

        if (payment != null && payment.getResNo() != null) {
            reservationRepository.findById(payment.getResNo()).ifPresent(reservation -> {
                reservation.setResStatus(4L); // 4 = 취소 처리 중
                reservation.setCancelReason(reason);
                reservationRepository.save(reservation);
            });
        }

        return 1;
    }

    @Override
    @Transactional
    public int updateStatus(Long refundNo, String status) {
        if (!List.of("COMPLETED", "REJECTED").contains(status)) {
            throw new IllegalArgumentException("올바르지 않은 상태 값입니다. (COMPLETED 또는 REJECTED만 허용)");
        }

        Refund refund = refundRepository.findById(refundNo)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 환불 내역입니다."));

        refund.setStatus(status);
        refundRepository.save(refund);

        if ("COMPLETED".equals(status)) {
            paymentService.update(refund.getPaymentNo(), "REFUNDED");
        }

        return 1;
    }

    @Override
    public List<RefundVO> list(PageObject pageObject) {
        return List.of();
    }

    @Override
    public RefundVO view(Long refundNo) {
        Refund refund = refundRepository.findById(refundNo)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 환불 내역입니다."));
        RefundVO vo = new RefundVO();
        vo.setRefundNo(refund.getRefundNo());
        vo.setPaymentNo(refund.getPaymentNo());
        vo.setRefundRate(refund.getRefundRate());
        vo.setRefundAmount(refund.getRefundAmount());
        vo.setStatus(refund.getStatus());
        vo.setRefundDate(refund.getRefundDate() != null ? refund.getRefundDate().format(DATETIME_FMT) : null);
        return vo;
    }
}