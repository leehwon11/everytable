package com.everytable.api.payment.controller;

import com.everytable.api.member.security.MemberUserDetails;
import com.everytable.api.payment.service.PaymentService;
import com.everytable.api.payment.vo.PaymentVO;
import com.everytable.api.util.page.PageObject;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentRestController {

    private final PaymentService paymentService;

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

    @GetMapping("/list.do")
    public Map<String, Object> list(HttpServletRequest request, Authentication authentication) {
        String loginId = currentLoginId(authentication);
        PageObject pageObject = PageObject.getInstance(request);
        String enforcedUserId = isAdmin(authentication) ? null : loginId;
        Map<String, Object> result = new HashMap<>();
        result.put("list", paymentService.list(pageObject, enforcedUserId));
        result.put("pageObject", pageObject);
        return result;
    }

    @GetMapping("/view.do")
    public PaymentVO view(Long no, Authentication authentication) {
        PaymentVO vo = paymentService.view(no);
        if (!isAdmin(authentication) && !vo.getUserNo().equals(currentUserNo(authentication))) {
            throw new RuntimeException("본인의 결제 내역만 조회할 수 있습니다.");
        }
        return vo;
    }

    @PostMapping("/write.do")
    public PaymentVO write(@RequestBody PaymentVO vo, Authentication authentication) {
        vo.setUserNo(currentUserNo(authentication));
        return paymentService.write(vo);
    }

    @PostMapping("/approve.do")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public Map<String, Object> approve(@RequestBody Map<String, Object> body) {
        Long resNo = Long.valueOf(body.get("resNo").toString());
        paymentService.approveByResNo(resNo);
        return Map.of("result", "ok");
    }

    @PostMapping("/refund.do")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public Map<String, Object> refund(@RequestBody Map<String, Object> body) {
        Long resNo = Long.valueOf(body.get("resNo").toString());
        paymentService.refundByResNo(resNo);
        return Map.of("result", "ok");
    }

    @PostMapping("/update.do")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> update(@RequestBody Map<String, Object> body) {
        Long paymentId = Long.valueOf(body.get("no").toString());
        String status = body.get("status").toString();
        int result = paymentService.update(paymentId, status);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/cancel.do")
    public Map<String, Object> cancel(@RequestBody Map<String, Object> body, Authentication authentication) {
        Long paymentId = Long.valueOf(body.get("no").toString());
        PaymentVO vo = paymentService.view(paymentId);
        if (!isAdmin(authentication) && !vo.getUserNo().equals(currentUserNo(authentication))) {
            throw new RuntimeException("본인의 결제만 취소할 수 있습니다.");
        }
        int result = paymentService.cancel(paymentId);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }
}