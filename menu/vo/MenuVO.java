package com.everytable.api.menu.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 원본 everytable.menu.vo.MenuVO 이식 (snake_case 필드 -> camelCase 로 정리)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuVO {
    private Long menuNo;
    private Long storeNo;
    private String menuName;
    private int price;
    private String description;
    private String imageUrl;
    private int isActive;
}
