package com.everytable.api.menu.service;

import com.everytable.api.menu.entity.Menu;
import com.everytable.api.menu.repository.MenuRepository;
import com.everytable.api.menu.vo.MenuVO;
import com.everytable.api.reservation.repository.OrdersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

// 원본 everytable.menu.dao.MenuDAO 이식 (list/listAll/view/write/update/delete/changeStatus)
@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {

    private final MenuRepository menuRepository;
    private final OrdersRepository ordersRepository;

    @Override
    public List<MenuVO> list(Long storeId) {
        List<MenuVO> list = new ArrayList<>();
        for (Menu m : menuRepository.findByStoreNoAndIsActiveOrderByMenuNoAsc(storeId, 1)) list.add(toVO(m));
        return list;
    }

    @Override
    public List<MenuVO> listAll(Long storeId) {
        List<MenuVO> list = new ArrayList<>();
        for (Menu m : menuRepository.findByStoreNoOrderByMenuNoAsc(storeId)) list.add(toVO(m));
        return list;
    }

    @Override
    public MenuVO view(Long menuNo) {
        return menuRepository.findById(menuNo).map(this::toVO)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 메뉴입니다."));
    }

    @Override
    @Transactional
    public MenuVO write(MenuVO vo) {
        Menu menu = Menu.builder()
                .storeNo(vo.getStoreNo())
                .menuName(vo.getMenuName())
                .price(vo.getPrice())
                .description(vo.getDescription())
                .imageUrl(vo.getImageUrl())
                .isActive(1)
                .build();
        return toVO(menuRepository.save(menu));
    }

    @Override
    @Transactional
    public int update(MenuVO vo) {
        Menu menu = menuRepository.findById(vo.getMenuNo())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 메뉴입니다."));
        menu.setMenuName(vo.getMenuName());
        menu.setPrice(vo.getPrice());
        menu.setDescription(vo.getDescription());
        menu.setImageUrl(vo.getImageUrl());
        menuRepository.save(menu);
        return 1;
    }


    @Override
    @Transactional
    public int delete(Long menuNo) {
        if (!menuRepository.existsById(menuNo)) return 0;

        // orders(주문 이력)가 있는 메뉴는 물리적으로 삭제하면 과거 주문 기록이 깨지므로 막는다.
        // menu_option/menu_image는 FK에 ON DELETE CASCADE를 걸어뒀으므로 DB가 자동으로 같이 지운다.
        if (ordersRepository.existsByMenuNo(menuNo)) {
            throw new RuntimeException("주문 이력이 있는 메뉴는 삭제할 수 없습니다. 품절 처리를 이용해주세요.");
        }

        menuRepository.deleteById(menuNo);
        return 1;
    }

    @Override
    @Transactional
    public int changeStatus(Long menuNo, int isActive) {
        Menu menu = menuRepository.findById(menuNo)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 메뉴입니다."));
        menu.setIsActive(isActive);
        menuRepository.save(menu);
        return 1;
    }

    private MenuVO toVO(Menu m) {
        MenuVO vo = new MenuVO();
        vo.setMenuNo(m.getMenuNo());
        vo.setStoreNo(m.getStoreNo());
        vo.setMenuName(m.getMenuName());
        vo.setPrice(m.getPrice());
        vo.setDescription(m.getDescription());
        vo.setImageUrl(m.getImageUrl());
        vo.setIsActive(m.getIsActive());
        return vo;
    }
}
