package com.everytable.api.review.controller;

import com.everytable.api.member.security.MemberUserDetails;
import com.everytable.api.review.service.ReviewService;
import com.everytable.api.review.vo.ReviewVO;
import com.everytable.api.store.service.StoreService;
import com.everytable.api.store.vo.StoreVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/review")
@RequiredArgsConstructor
public class ReviewRestController {

    private final ReviewService reviewService;
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

    // 1. 내가 쓴 리뷰 목록
    @GetMapping("/list.do")
    public List<ReviewVO> list(Authentication authentication) {
        return reviewService.myList(currentLoginId(authentication));
    }

    // 2. 매장 상세페이지 리뷰 목록 (누구나 조회 가능)
    @GetMapping("/storeList.do")
    public List<ReviewVO> storeList(Long storeId) {
        return reviewService.list(storeId);
    }

    // 3. [점주] 내 매장 리뷰 관리 목록
    @GetMapping("/adminList.do")
    public List<ReviewVO> adminList(@RequestParam Long storeNo, Authentication authentication) {
        checkOwner(storeNo, authentication);
        return reviewService.adminList(storeNo);
    }

    private void checkOwner(Long storeNo, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;
        StoreVO store = storeService.view(storeNo);
        if (!store.getOwnerNo().equals(currentUserNo(authentication))) {
            throw new RuntimeException("본인 매장의 리뷰만 관리할 수 있습니다.");
        }
    }

    // 3-1. 리뷰 상세 (수정 폼용, 본인 리뷰만)
    @GetMapping("/view.do")
    public ReviewVO view(Long no, Authentication authentication) {
        ReviewVO vo = reviewService.view(no);
        if (!vo.getUserNo().equals(currentUserNo(authentication))) {
            throw new RuntimeException("본인 리뷰만 조회할 수 있습니다.");
        }
        return vo;
    }

    // 4. 리뷰 작성
    @PostMapping("/write.do")
    public ReviewVO write(@RequestBody ReviewVO vo, Authentication authentication) {
        vo.setUserNo(currentUserNo(authentication));
        return reviewService.write(vo);
    }

    // 5. 리뷰 삭제 (본인 리뷰만)
    @PostMapping("/delete.do")
    public Map<String, Object> delete(@RequestBody Map<String, Object> body, Authentication authentication) {
        Long no = Long.valueOf(body.get("no").toString());
        ReviewVO vo = reviewService.view(no);
        if (!vo.getUserNo().equals(currentUserNo(authentication))) {
            throw new RuntimeException("본인 리뷰만 삭제할 수 있습니다.");
        }
        int result = reviewService.delete(no);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    // 6. 리뷰 수정 (본인 리뷰만)
    @PostMapping("/update.do")
    public Map<String, Object> update(@RequestBody Map<String, Object> body, Authentication authentication) {
        Long no = Long.valueOf(body.get("no").toString());
        String content = (String) body.get("content");
        Integer rating = Integer.valueOf(body.get("rating").toString());
        ReviewVO vo = reviewService.view(no);
        if (!vo.getUserNo().equals(currentUserNo(authentication))) {
            throw new RuntimeException("본인 리뷰만 수정할 수 있습니다.");
        }
        int result = reviewService.update(no, content, rating);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }
}