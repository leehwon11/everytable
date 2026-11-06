package com.everytable.api.payment.repository;

import com.everytable.api.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // 예약 번호(resNo)로 결제 정보 조회
    // - 정상적으로는 예약 1건당 결제 1건이지만, 재시도 등으로 중복 행이 생겨도
    //   목록 조회가 죽지 않도록 "가장 최근(paymentNo가 큰) 1건"만 안전하게 가져온다.
    Optional<Payment> findFirstByResNoOrderByPaymentNoDesc(Long resNo);
    boolean existsByResNo(Long resNo);
}