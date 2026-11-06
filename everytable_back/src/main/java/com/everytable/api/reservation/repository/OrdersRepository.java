package com.everytable.api.reservation.repository;

import com.everytable.api.reservation.entity.Orders;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface OrdersRepository extends JpaRepository<Orders, Long> {

    List<Orders> findByResNo(Long resNo);

    /** 예약 수정 시 기존 주문 메뉴 전체 삭제. DML이므로 @Modifying + @Transactional 필수. */
    @Modifying
    @Transactional
    void deleteByResNo(Long resNo);

    // 메뉴 삭제 전 주문 이력 존재 여부 확인용
    boolean existsByMenuNo(Long menuNo);
}