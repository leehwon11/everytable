package com.everytable.api.store.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoreVO {
    private Long storeNo;
    private Long ownerNo;
    private double avgRating;
    private int reviewCount;
    private String filename;
    private String storeName;
    private Integer storeCateNo;
    private String storeCateName;   // 화면 표시용 (NoticeVO의 cateNo/cateName과 동일 패턴)
    private String storeAddr;
    private String storeTel;
    private String openTime;
    private int minOrderPrice;
    private String prepareTime;
    private String refundPolicy24;
    private String refundPolicy12;
    private String refundPolicy0;
}