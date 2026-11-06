package com.everytable.api.notice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 팀 최종 스키마에 새로 생긴 공지 카테고리 마스터 테이블 (cate_no: 1~4 고정값, AUTO_INCREMENT 아님).
 * notice.cate_no가 이 테이블을 실제로 참조하는 FK라서, notice INSERT 전에 이 테이블에
 * 데이터가 미리 들어있어야 한다.
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "notice_cate")
public class NoticeCate {

    @Id
    private Integer noticeCateNo;

    @Column(nullable = false, length = 20)
    private String cateName;
}
