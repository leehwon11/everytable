package com.everytable.api.reservation.repository;

import com.everytable.api.reservation.entity.Reservation;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepositoryCustom {

    List<Reservation> searchByUser(Long userNo, String key, long offset, long limit);

    long searchByUserCount(Long userNo, String key);

    List<Reservation> searchByStore(Long storeNo, String key, long offset, long limit);

    long searchByStoreCount(Long storeNo, String key);

    // 다중 매장 지원: 여러 매장의 주문을 한 번에 조회 (주문 관리 - 전체 보기)
    List<Reservation> searchByStoreIn(List<Long> storeNos, String key, long offset, long limit);

    long searchByStoreInCount(List<Long> storeNos, String key);

    // 관리자 전용: 매장 구분 없이 전체 예약 조회
    List<Reservation> searchAll(String key, long offset, long limit);

    long searchAllCount(String key);

    List<Long> topStoreNosByOrderCount(LocalDateTime from, LocalDateTime to, long limit);

}