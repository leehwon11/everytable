package com.everytable.api.reservation.vo;

import lombok.Data;

import java.util.List;

@Data
public class ReservationVO {
    private Long resNo;
    private Long userNo;
    private String userName;
    private String resDate;
    private String resTime;
    private Long resCount;
    private String resPhone;
    /** 1=결제 전, 2=예약 승인, 3=완료, 4=취소 처리 중, 5=취소 */
    private Long resStatus;
    private Long storeNo;
    private String storeName;
    private Long totalPrice;
    private String cancelReason;
    private String resCreatedAt;
    private String resType;
    private String orderAdd;
    private List<OrdersVO> orderList;
    private Long reviewNo;
    /** 결제 수단이 이미 등록되어 있으면 true (중복 등록 방지용) */
    private Boolean hasPayment;
}