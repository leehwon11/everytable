package com.everytable.api.reservation.vo;

import lombok.Data;

@Data
public class OrdersVO {
    private Long ordersNo;
    private Long menuNo;
    private String menuName;
    private Long quantity;
    private Long price;
    private String adds;  // 개인 요청사항
    private String op;    // 선택된 옵션 문자열 (예: "사이즈=L,온도=아이스")
}