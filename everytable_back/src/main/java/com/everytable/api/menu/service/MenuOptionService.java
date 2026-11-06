package com.everytable.api.menu.service;

import com.everytable.api.menu.vo.MenuOptionGroupVO;

import java.util.List;

public interface MenuOptionService {

    /** 메뉴의 옵션 목록을 그룹 단위로 반환 (관리 화면 + 고객 주문 화면 공용) */
    List<MenuOptionGroupVO> groupedList(Long menuNo);

    /**
     * 메뉴의 옵션 구성을 통째로 저장.
     * 기존 옵션 전부 삭제 후 groups를 재삽입 (점주가 편집 화면에서 저장 버튼 누를 때 호출).
     */
    void save(Long menuNo, List<MenuOptionGroupVO> groups);
}