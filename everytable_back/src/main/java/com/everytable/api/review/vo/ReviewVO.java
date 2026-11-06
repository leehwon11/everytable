package com.everytable.api.review.vo;

import lombok.Data;

@Data
public class ReviewVO {
    private Long reviewNo;
    private String content;
    private Long userNo;
    private String userName;
    private Long storeNo;
    private Long resNo;
    private String storeName;
    private Integer rating;
    private String createdAt;
}