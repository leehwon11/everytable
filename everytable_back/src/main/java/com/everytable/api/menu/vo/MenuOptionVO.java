package com.everytable.api.menu.vo;

import lombok.Data;

/** 메뉴 옵션 한 행 DTO */
@Data
public class MenuOptionVO {
    private Long   optionNo;
    private Long   menuNo;
    private String optionName;   // 그룹명 (예: "사이즈")
    private String optionValue;  // 값    (예: "L")
    private int    additionalPrice;
    private int    isRequired;   // 1: 필수, 0: 선택
}