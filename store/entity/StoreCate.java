package com.everytable.api.store.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 팀 최종 스키마에 새로 생긴 매장 카테고리 마스터 테이블.
 * store.store_cate는 이 테이블을 FK로 참조하지 않고 카테고리 이름을 문자열로 직접 저장하므로
 * (원본 store/write.jsp의 select 옵션과 동일한 방식), 이 테이블은 참고/관리용 조회 전용이다.
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "store_cate")
public class StoreCate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer storeCateNo;

    @Column(nullable = false, length = 30)
    private String cateName;
}
