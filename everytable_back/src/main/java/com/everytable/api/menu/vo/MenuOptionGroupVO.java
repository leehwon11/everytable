package com.everytable.api.menu.vo;

import lombok.Data;

import java.util.List;

@Data
public class MenuOptionGroupVO {
    private String optionName;
    private int    isRequired;
    private int    isMultiple;  // 복수 선택 허용 여부
    private List<MenuOptionValueVO> values;

    @Data
    public static class MenuOptionValueVO {
        private Long   optionNo;
        private String optionValue;
        private int    additionalPrice;
    }
}