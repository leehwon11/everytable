package com.everytable.api.menu.repository;

import com.everytable.api.menu.entity.MenuOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MenuOptionRepository extends JpaRepository<MenuOption, Long> {
    List<MenuOption> findByMenuNo(Long menuNo);

    /** 메뉴 옵션 전체 삭제 (save 시 기존 옵션 갈아끼우기용) */
    @Modifying
    @Transactional
    void deleteByMenuNo(Long menuNo);
}