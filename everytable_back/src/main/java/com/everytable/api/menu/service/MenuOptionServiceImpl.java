package com.everytable.api.menu.service;

import com.everytable.api.menu.entity.MenuOption;
import com.everytable.api.menu.repository.MenuOptionRepository;
import com.everytable.api.menu.vo.MenuOptionGroupVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MenuOptionServiceImpl implements MenuOptionService {

    private final MenuOptionRepository menuOptionRepository;

    @Override
    public List<MenuOptionGroupVO> groupedList(Long menuNo) {
        List<MenuOption> flat = menuOptionRepository.findByMenuNo(menuNo);

        Map<String, MenuOptionGroupVO> map = new LinkedHashMap<>();
        for (MenuOption opt : flat) {
            MenuOptionGroupVO group = map.computeIfAbsent(opt.getOptionName(), name -> {
                MenuOptionGroupVO g = new MenuOptionGroupVO();
                g.setOptionName(name);
                g.setIsRequired(opt.getIsRequired());
                g.setIsMultiple(opt.getIsMultiple());  // 복수 선택 여부
                g.setValues(new ArrayList<>());
                return g;
            });
            MenuOptionGroupVO.MenuOptionValueVO val = new MenuOptionGroupVO.MenuOptionValueVO();
            val.setOptionNo(opt.getOptionNo());
            val.setOptionValue(opt.getOptionValue());
            val.setAdditionalPrice(opt.getAdditionalPrice());
            group.getValues().add(val);
        }
        return new ArrayList<>(map.values());
    }

    @Override
    @Transactional
    public void save(Long menuNo, List<MenuOptionGroupVO> groups) {
        menuOptionRepository.deleteByMenuNo(menuNo);

        if (groups == null || groups.isEmpty()) return;

        for (MenuOptionGroupVO group : groups) {
            if (group.getValues() == null) continue;
            for (MenuOptionGroupVO.MenuOptionValueVO val : group.getValues()) {
                menuOptionRepository.save(MenuOption.builder()
                        .menuNo(menuNo)
                        .optionName(group.getOptionName())
                        .optionValue(val.getOptionValue())
                        .additionalPrice(val.getAdditionalPrice())
                        .isRequired(group.getIsRequired())
                        .isMultiple(group.getIsMultiple())  // 복수 선택 여부 저장
                        .build());
            }
        }
    }
}