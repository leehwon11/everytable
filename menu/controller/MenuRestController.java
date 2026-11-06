package com.everytable.api.menu.controller;

import com.everytable.api.member.security.MemberUserDetails;
import com.everytable.api.menu.service.MenuService;
import com.everytable.api.menu.vo.MenuVO;
import com.everytable.api.store.service.StoreService;
import com.everytable.api.store.vo.StoreVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 원본 everytable.menu.controller.MenuController 이식.
 * 원본은 store_id 파라메터가 없으면 세션의 로그인 정보로 매장을 찾아 redirect 시켰지만,
 * REST 구조에서는 프론트(React)가 매장 목록/상세 화면에서 storeNo를 이미 알고 넘겨주는
 * 방식으로 대체했다.
 */
@RestController
@RequestMapping("/menu")
@RequiredArgsConstructor
public class MenuRestController {

    private final MenuService menuService;
    private final StoreService storeService;

    private Long currentUserNo(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof MemberUserDetails details)) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return details.getMember().getNo();
    }

    // 매장 소유주(또는 관리자)인지 확인 - 다중 매장 지원: "내 매장 하나"를 찾아 비교하는 대신,
    // 대상 storeNo를 직접 조회해서 owner_no가 로그인한 회원번호와 같은지 비교한다.
    private void checkOwner(Long storeNo, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;
        StoreVO store = storeService.view(storeNo);
        if (!store.getOwnerNo().equals(currentUserNo(authentication))) {
            throw new RuntimeException("본인 매장의 메뉴만 관리할 수 있습니다.");
        }
    }

    // 고객용 - 판매중 메뉴만
    @GetMapping("/list.do")
    public List<MenuVO> list(Long storeNo) {
        return menuService.list(storeNo);
    }

    @GetMapping("/listAll.do")
    public List<MenuVO> listAll(Long storeNo, Authentication authentication) {
        checkOwner(storeNo, authentication);
        return menuService.listAll(storeNo);
    }

    @GetMapping("/view.do")
    public MenuVO view(Long menuNo) {
        return menuService.view(menuNo);
    }

    @PostMapping("/write.do")
    public MenuVO write(@RequestBody MenuVO vo, Authentication authentication) {
        checkOwner(vo.getStoreNo(), authentication);
        return menuService.write(vo);
    }

    @PostMapping("/update.do")
    public Map<String, Object> update(@RequestBody MenuVO vo, Authentication authentication) {
        checkOwner(menuService.view(vo.getMenuNo()).getStoreNo(), authentication);
        int result = menuService.update(vo);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/delete.do")
    public Map<String, Object> delete(@RequestBody Map<String, Object> body, Authentication authentication) {
        Long menuNo = Long.valueOf(body.get("menuNo").toString());
        checkOwner(menuService.view(menuNo).getStoreNo(), authentication);
        int result = menuService.delete(menuNo);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/changeStatus.do")
    public Map<String, Object> changeStatus(@RequestBody Map<String, Object> body, Authentication authentication) {
        Long menuNo = Long.valueOf(body.get("menuNo").toString());
        int isActive = Integer.parseInt(body.get("isActive").toString());
        checkOwner(menuService.view(menuNo).getStoreNo(), authentication);
        int result = menuService.changeStatus(menuNo, isActive);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }
}