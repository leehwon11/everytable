package com.everytable.api.menu.repository;

import com.everytable.api.menu.entity.MenuImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuImageRepository extends JpaRepository<MenuImage, Long> {
    List<MenuImage> findByMenuNo(Long menuNo);
}
