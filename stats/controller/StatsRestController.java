package com.everytable.api.stats.controller;

import com.everytable.api.member.security.MemberUserDetails;
import com.everytable.api.stats.service.StatsService;
import com.everytable.api.store.entity.Store;
import com.everytable.api.store.repository.StoreRepository;
import com.everytable.api.store.service.StoreService;
import com.everytable.api.store.vo.StoreVO;
import com.everytable.api.util.page.PageObject;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class StatsRestController {

    private final StatsService statsService;
    private final StoreService storeService;
    private final StoreRepository storeRepository;

    private Long currentUserNo(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof MemberUserDetails details)) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return details.getMember().getNo();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    // storeCate는 이제 store_cate 테이블(FK)의 storeCateNo(Integer)로 필터링한다.
    private List<Long> resolveStoreNos(Long storeNo, Integer storeCateNo, String region, Authentication authentication) {
        boolean admin = isAdmin(authentication);

        if (storeNo != null) {
            if (!admin) {
                StoreVO store = storeService.view(storeNo);
                if (store == null || !store.getOwnerNo().equals(currentUserNo(authentication))) {
                    throw new RuntimeException("본인 매장만 조회할 수 있습니다.");
                }
            }
            return List.of(storeNo);
        }

        if (!admin) {
            return storeRepository.findAllByOwnerNo(currentUserNo(authentication)).stream()
                    .map(Store::getStoreNo).toList();
        }

        boolean hasCate = storeCateNo != null;
        boolean hasRegion = region != null && !region.isBlank();
        if (!hasCate && !hasRegion) return null;

        List<Store> filtered;
        if (hasCate && hasRegion) {
            filtered = storeRepository.findByStoreCateNoAndStoreAddrContaining(storeCateNo, region);
        } else if (hasCate) {
            filtered = storeRepository.findByStoreCateNo(storeCateNo);
        } else {
            filtered = storeRepository.findByStoreAddrContaining(region);
        }
        return filtered.stream().map(Store::getStoreNo).toList();
    }

    @GetMapping("/dashboard.do")
    public Map<String, Object> dashboard(@RequestParam(required = false) Long storeNo,
                                         @RequestParam(required = false) Integer storeCateNo,
                                         @RequestParam(required = false) String region,
                                         HttpServletRequest request,
                                         Authentication authentication) {
        List<Long> storeNos = resolveStoreNos(storeNo, storeCateNo, region, authentication);
        PageObject pageObject = PageObject.getInstance(request);
        return statsService.dashboard(storeNos, pageObject);
    }

    @GetMapping("/sales.do")
    public Map<String, Object> sales(@RequestParam(required = false) Long storeNo,
                                     @RequestParam(required = false) Integer storeCateNo,
                                     @RequestParam(required = false) String region,
                                     @RequestParam(required = false) String startDate,
                                     @RequestParam(required = false) String endDate,
                                     HttpServletRequest request,
                                     Authentication authentication) {
        List<Long> storeNos = resolveStoreNos(storeNo, storeCateNo, region, authentication);
        PageObject pageObject = PageObject.getInstance(request);
        LocalDate sd = (startDate == null || startDate.isBlank()) ? null : LocalDate.parse(startDate);
        LocalDate ed = (endDate == null || endDate.isBlank()) ? null : LocalDate.parse(endDate);
        return statsService.salesPeriod(storeNos, sd, ed, pageObject);
    }
}
