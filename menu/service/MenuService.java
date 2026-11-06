package com.everytable.api.menu.service;

import com.everytable.api.menu.vo.MenuVO;

import java.util.List;

public interface MenuService {
    List<MenuVO> list(Long storeId);      // 고객용 - 판매중만
    List<MenuVO> listAll(Long storeId);   // 점주 관리용 - 전체
    MenuVO view(Long menuNo);
    MenuVO write(MenuVO vo);
    int update(MenuVO vo);
    int delete(Long menuNo);
    int changeStatus(Long menuNo, int isActive);
}
