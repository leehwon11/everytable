package com.everytable.api.menu.entity;

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
@Table(name = "menu_option")
public class MenuOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long optionNo;

    @Column(nullable = false)
    private Long menuNo;

    /** 옵션 그룹명 (예: "온도", "사이즈") */
    @Column(nullable = false, length = 30)
    private String optionName;

    /** 옵션 값 (예: "핫", "아이스", "S", "M", "L") */
    @Column(nullable = false, length = 30)
    private String optionValue;

    /** 필수 여부 (1: 필수, 0: 선택) */
    @Builder.Default
    @Column(nullable = false)
    private int isRequired = 0;

    /** 복수 선택 허용 여부 (1: 복수, 0: 단일) */
    @Builder.Default
    @Column(nullable = false)
    private int isMultiple = 0;

    /** 추가 금액 */
    @Column(nullable = false)
    private int additionalPrice;
}