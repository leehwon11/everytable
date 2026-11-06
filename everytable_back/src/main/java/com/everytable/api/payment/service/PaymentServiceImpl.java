package com.everytable.api.payment.service;

import com.everytable.api.member.repository.MemberRepository;
import com.everytable.api.payment.entity.Payment;
import com.everytable.api.payment.repository.PaymentRepository;
import com.everytable.api.payment.repository.PaymentRepositoryCustom;
import com.everytable.api.payment.vo.PaymentVO;
import com.everytable.api.reservation.entity.Reservation;
import com.everytable.api.reservation.repository.ReservationRepository;
import com.everytable.api.util.page.PageObject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final PaymentRepository paymentRepository;
    private final PaymentRepositoryCustom paymentRepositoryCustom;
    private final ReservationRepository reservationRepository;
    private final MemberRepository memberRepository;

    @Override
    public List<PaymentVO> list(PageObject pageObject, String enforcedUserId) {
        long total = paymentRepositoryCustom.searchCount(pageObject.getKey(), pageObject.getWord(), enforcedUserId);
        pageObject.setTotalRow(total);

        List<Payment> list = paymentRepositoryCustom.search(
                pageObject.getKey(), pageObject.getWord(), enforcedUserId, pageObject.getLimit(), pageObject.getPerPageNum());

        if (list.isEmpty()) {
            return new ArrayList<>();
        }

        // 💡 [N+1 최적화] 목록에 있는 payment들의 resNo를 모아서 예약과 회원 정보를 단 한 번의 쿼리(IN 절)로 일괄 조회
        List<Long> resNos = list.stream().map(Payment::getResNo).distinct().toList();
        List<Reservation> reservations = reservationRepository.findAllById(resNos);
        Map<Long, Reservation> reservationMap = reservations.stream()
                .collect(Collectors.toMap(Reservation::getResNo, r -> r));

        List<Long> userNos = reservations.stream().map(Reservation::getUserNo).distinct().toList();
        Map<Long, String> memberNameMap = memberRepository.findAllById(userNos).stream()
                .collect(Collectors.toMap(m -> m.getNo(), m -> m.getName()));

        // VO로 변환
        List<PaymentVO> result = new ArrayList<>();
        for (Payment p : list) {
            Reservation r = reservationMap.get(p.getResNo());
            String userName = (r != null) ? memberNameMap.get(r.getUserNo()) : null;
            result.add(toVOWithCache(p, r, userName));
        }
        return result;
    }

    @Override
    public PaymentVO view(Long paymentId) {
        Payment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 결제입니다."));
        return toVO(p);
    }

    @Override
    @Transactional
    public PaymentVO write(PaymentVO vo) {
        Reservation reservation = reservationRepository.findById(vo.getOrderNo())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 예약입니다."));
        if (!reservation.getUserNo().equals(vo.getUserNo())) {
            throw new RuntimeException("본인의 예약에 대해서만 결제 수단을 등록할 수 있습니다.");
        }

        Payment payment = Payment.builder()
                .resNo(vo.getOrderNo())
                .method(vo.getMethod())
                .amount(vo.getAmount())
                .status("PENDING")
                .payDate(LocalDateTime.now())
                .pickupDate(vo.getPickupDate() == null ? LocalDateTime.now() : LocalDateTime.parse(vo.getPickupDate()))
                .build();
        return toVO(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public void approveByResNo(Long resNo) {
        Payment payment = paymentRepository.findFirstByResNoOrderByPaymentNoDesc(resNo)
                .orElseThrow(() -> new RuntimeException("등록된 결제 수단이 존재하지 않습니다."));

        if (!"PENDING".equals(payment.getStatus())) {
            throw new RuntimeException("결제 대기(PENDING) 상태의 건만 결제 승인이 가능합니다.");
        }

        payment.setStatus("SUCCESS");
        payment.setPayDate(LocalDateTime.now());
        payment.setUpdateDate(LocalDateTime.now());
        paymentRepository.save(payment);
    }

    @Override
    @Transactional
    public void refundByResNo(Long resNo) {
        Payment payment = paymentRepository.findFirstByResNoOrderByPaymentNoDesc(resNo)
                .orElseThrow(() -> new RuntimeException("결제 내역이 존재하지 않습니다."));

        if ("SUCCESS".equals(payment.getStatus())) {
            payment.setStatus("REFUNDED");
        } else if ("PENDING".equals(payment.getStatus())) {
            payment.setStatus("FAIL");
        }
        payment.setUpdateDate(LocalDateTime.now());
        paymentRepository.save(payment);
    }

    @Override
    @Transactional
    public void updatePaymentByResNo(Long resNo, Long amount, String pickupDate) {
        Payment payment = paymentRepository.findFirstByResNoOrderByPaymentNoDesc(resNo).orElse(null);
        if (payment == null) return;

        if ("PENDING".equals(payment.getStatus())) {
            payment.setAmount(amount);
            if (pickupDate != null) {
                payment.setPickupDate(LocalDateTime.parse(pickupDate));
            }
            payment.setUpdateDate(LocalDateTime.now());
            paymentRepository.save(payment);
        }
    }

    @Override
    @Transactional
    public int update(Long paymentId, String status) {
        Payment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 결제입니다."));
        p.setStatus(status);
        p.setUpdateDate(LocalDateTime.now());
        paymentRepository.save(p);
        return 1;
    }

    @Override
    @Transactional
    public int cancel(Long paymentId) {
        Payment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 결제입니다."));
        p.setStatus("REFUNDED");
        p.setUpdateDate(LocalDateTime.now());
        paymentRepository.save(p);
        return 1;
    }

    @Override
    public Long todaySalesSum(List<Long> storeNos) {
        return paymentRepositoryCustom.todaySalesSum(storeNos, LocalDate.now());
    }

    @Override
    public Long todayOrderCount(List<Long> storeNos) {
        return paymentRepositoryCustom.todayOrderCount(storeNos, LocalDate.now());
    }

    // 단건 조회(view)용 기존 toVO 유지
    private PaymentVO toVO(Payment p) {
        Reservation reservation = reservationRepository.findById(p.getResNo()).orElse(null);
        String userName = null;
        if (reservation != null) {
            userName = memberRepository.findById(reservation.getUserNo())
                    .map(m -> m.getName()).orElse(null);
        }
        return toVOWithCache(p, reservation, userName);
    }

    // 💡 [최적화 공통 메서드] 이미 조회해 둔 예약 정보와 회원명을 활용해 VO 생성 (추가 쿼리 발생 없음)
    private PaymentVO toVOWithCache(Payment p, Reservation reservation, String userName) {
        PaymentVO vo = new PaymentVO();
        vo.setPaymentNo(p.getPaymentNo());
        vo.setOrderNo(p.getResNo());

        if (reservation != null) {
            vo.setStoreNo(reservation.getStoreNo());
            vo.setUserNo(reservation.getUserNo());
            vo.setUserName(userName);
        }

        vo.setMethod(p.getMethod());
        vo.setAmount(p.getAmount());
        vo.setStatus(p.getStatus());
        vo.setResStatus(reservation.getResStatus());          // 💡 추가
        vo.setCancelReason(reservation.getCancelReason());
        vo.setPayDate(p.getPayDate() == null ? null : p.getPayDate().format(DATETIME_FMT));
        vo.setUpdateDate(p.getUpdateDate() == null ? null : p.getUpdateDate().format(DATETIME_FMT));
        vo.setPickupDate(p.getPickupDate() == null ? null : p.getPickupDate().format(DATETIME_FMT));
        return vo;
    }
}