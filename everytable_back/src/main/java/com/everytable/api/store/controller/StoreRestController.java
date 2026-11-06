package com.everytable.api.store.controller;

import com.everytable.api.member.security.MemberUserDetails;
import com.everytable.api.store.service.StoreService;
import com.everytable.api.store.vo.StoreVO;
import com.everytable.api.util.page.PageObject;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// 원본 everytable.store.controller.StoreController 이식 (write/view/findByMemberId/update/list)
// 다중 매장 지원: myStores.do 추가, update.do 소유권 체크를 owner_no 직접 비교로 변경.
@RestController
@RequestMapping("/store")
@RequiredArgsConstructor
public class StoreRestController {

    private final StoreService storeService;

    private String currentLoginId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof MemberUserDetails details)) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return details.getUsername();
    }

    private Long currentUserNo(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof MemberUserDetails details)) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return details.getMember().getNo();
    }

    @PostMapping("/write.do")
    public StoreVO write(@RequestBody StoreVO vo, Authentication authentication) {
        vo.setOwnerNo(currentUserNo(authentication)); // owner_no는 클라이언트가 아닌 로그인 세션(토큰) 기준으로 강제 설정
        return storeService.write(vo);
    }

    @GetMapping("/view.do")
    public StoreVO view(Long storeId) {
        return storeService.view(storeId);
    }

    // 매장을 하나만 갖던 시절의 잔재 - 다중 매장 지원 후에는 myStores.do를 우선 사용한다.
    @GetMapping("/myStore.do")
    public StoreVO myStore(Authentication authentication) {
        return storeService.findByMemberId(currentLoginId(authentication));
    }

    // 다중 매장 지원: 로그인한 점주의 매장 전체 목록 (관리자면 플랫폼 전체 매장 목록)
    @GetMapping("/myStores.do")
    public List<StoreVO> myStores(Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return storeService.allStores();
        }
        return storeService.myStores(currentUserNo(authentication));
    }

    @PostMapping("/update.do")
    public Map<String, Object> update(@RequestBody StoreVO vo, Authentication authentication) {
        StoreVO target = storeService.view(vo.getStoreNo());
        if (!target.getOwnerNo().equals(currentUserNo(authentication))) {
            return Map.of("result", "fail", "message", "본인 매장만 수정할 수 있습니다.");
        }
        int result = storeService.update(vo);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @GetMapping("/list.do")
    public ResponseEntity<Map<String, Object>> list(HttpServletRequest request) {
        PageObject pageObject = PageObject.getInstance(request);
        return ResponseEntity.status(HttpStatus.OK).body(storeService.list(pageObject));
    }
}