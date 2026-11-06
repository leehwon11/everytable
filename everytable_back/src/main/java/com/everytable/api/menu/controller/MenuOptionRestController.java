package com.everytable.api.menu.controller;

import com.everytable.api.member.security.MemberUserDetails;
import com.everytable.api.menu.service.MenuOptionService;
import com.everytable.api.menu.service.MenuService;
import com.everytable.api.menu.vo.MenuOptionGroupVO;
import com.everytable.api.store.service.StoreService;
import com.everytable.api.store.vo.StoreVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/menu/option")
@RequiredArgsConstructor
public class MenuOptionRestController {

    private final MenuOptionService menuOptionService;
    private final MenuService       menuService;
    private final StoreService      storeService;

    private Long currentUserNo(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof MemberUserDetails details)) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return details.getMember().getNo();
    }

    /** menuNo → storeNo → ownerNo 체인으로 점주 권한 확인 */
    private void checkOwner(Long menuNo, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;
        Long storeNo = menuService.view(menuNo).getStoreNo();
        StoreVO store = storeService.view(storeNo);
        if (!store.getOwnerNo().equals(currentUserNo(authentication))) {
            throw new RuntimeException("본인 매장의 메뉴 옵션만 관리할 수 있습니다.");
        }
    }

    /**
     * GET /menu/option/list.do?menuNo=
     * 고객(주문 화면) + 점주(관리 화면) 공용 — 인증 없이도 조회 가능
     */
    @GetMapping("/list.do")
    public List<MenuOptionGroupVO> list(@RequestParam Long menuNo) {
        return menuOptionService.groupedList(menuNo);
    }

    /**
     * POST /menu/option/save.do
     * Body: { menuNo, groups: [ { optionName, isRequired, values: [{optionValue, additionalPrice}] } ] }
     * 점주 권한 필요
     */
    @PostMapping("/save.do")
    public Map<String, Object> save(@RequestBody SaveRequest req, Authentication authentication) {
        checkOwner(req.menuNo, authentication);
        menuOptionService.save(req.menuNo, req.groups);
        return Map.of("result", "ok");
    }

    public static class SaveRequest {
        public Long menuNo;
        public List<MenuOptionGroupVO> groups;
    }
}