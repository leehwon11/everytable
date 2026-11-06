package com.everytable.api.store.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "store")
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long storeNo;

    private Long ownerNo;

    @Column(nullable = false, length = 100)
    private String storeName;

    // store_cate 테이블(store_cate_no) 참조 FK. 컬럼명은 그대로 store_cate라서
    // 필드명(storeCateNo)과 컬럼명이 어긋나 @Column(name=...)을 명시해야 한다.
    @Column(name = "store_cate")
    private Integer storeCateNo;

    @Column(length = 200)
    private String storeAddr;

    @Column(length = 20)
    private String storeTel;

    @Column(length = 50)
    private String openTime;

    @Builder.Default
    private int minOrderPrice = 0;

    @Column(length = 50)
    private String prepareTime;

    @Column(length = 4000)
    private String filename;

    @Builder.Default
    private double avgRating = 0;

    @Builder.Default
    private int reviewCount = 0;

    @Column(name = "refund_policy_24", length = 100)
    private String refundPolicy24;
    @Column(name = "refund_policy_12", length = 100)
    private String refundPolicy12;
    @Column(name = "refund_policy_0", length = 100)
    private String refundPolicy0;
}