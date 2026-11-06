package com.everytable.api.menu.repository;

import com.everytable.api.menu.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuRepository extends JpaRepository<Menu, Long> {

    // 고객용 - 판매중(is_active=1)만 조회
    List<Menu> findByStoreNoAndIsActiveOrderByMenuNoAsc(Long storeId, int isActive);

    // 점주 관리용 - 품절 포함 전체 조회
    List<Menu> findByStoreNoOrderByMenuNoAsc(Long storeId);
}
