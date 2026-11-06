package com.everytable.api.refund.controller;

import com.everytable.api.member.security.MemberUserDetails;
import com.everytable.api.refund.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/refund")
@RequiredArgsConstructor
public class RefundRestController {

    private final RefundService refundService;

    private String currentLoginId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof MemberUserDetails details)) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return details.getUsername();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private Long currentUserNo(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof MemberUserDetails details)) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return details.getMember().getNo();
    }

    // 1. 환불 신청 폼 정보 조회
    @GetMapping("/refundForm.do")
    public Map<String, Object> refundForm(Long no, Authentication authentication) {
        return refundService.refundForm(no, currentUserNo(authentication), isAdmin(authentication));
    }

    // 2. 환불 신청
    @PostMapping("/refund.do")
    public Map<String, Object> refund(@RequestBody Map<String, Object> body, Authentication authentication) {
        Long orderNo = Long.valueOf(body.get("orderNo").toString());
        Long paymentNo = Long.valueOf(body.get("paymentNo").toString());
        Long refundRate = Long.valueOf(body.get("refundRate").toString());
        Long refundAmount = Long.valueOf(body.get("refundAmount").toString());
        String reason = body.get("reason") == null ? null : body.get("reason").toString();
        Long userNo = currentUserNo(authentication);

        int result = refundService.refund(orderNo, userNo, paymentNo, refundRate, refundAmount, reason);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    // 3. [관리자/점주] 환불 승인/거절 처리 (status: COMPLETED 또는 REJECTED)
    @PostMapping("/updateStatus.do")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public Map<String, Object> updateStatus(@RequestBody Map<String, Object> body) {
        Long refundNo = Long.valueOf(body.get("refundNo").toString());
        String status = body.get("status").toString();

        int result = refundService.updateStatus(refundNo, status);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }
}