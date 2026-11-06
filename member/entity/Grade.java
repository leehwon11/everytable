package com.everytable.api.member.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 팀 최종 스키마에 새로 생긴 등급 마스터 테이블 (grade_no: 1/2/9 고정값, AUTO_INCREMENT 아님).
 * 애플리케이션 로직은 원래부터 grade_no 값만으로 gradeName을 계산해왔으므로(Member.getGradeName()),
 * Member 엔티티에서 이 테이블로의 @ManyToOne 연관관계는 만들지 않고 grade_no만 평범한 컬럼으로 저장한다.
 * 다만 grade_no가 FK 제약이 걸려 있으므로, member INSERT 전에 이 테이블에 1/2/9 행이 반드시 있어야 한다.
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "grade")
public class Grade {

    @Id
    private Integer gradeNo;

    @Column(nullable = false, length = 15)
    private String gradeName;
}
