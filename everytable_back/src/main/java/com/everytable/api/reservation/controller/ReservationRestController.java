package com.everytable.api.reservation.controller;

import com.everytable.api.member.security.MemberUserDetails;
import com.everytable.api.menu.repository.MenuRepository;
import com.everytable.api.menu.vo.MenuVO;
import com.everytable.api.reservation.entity.Orders;
import com.everytable.api.reservation.repository.OrdersRepository;
import com.everytable.api.reservation.service.ReservationService;
import com.everytable.api.reservation.vo.OrdersVO;
import com.everytable.api.reservation.vo.ReservationVO;
import com.everytable.api.store.repository.StoreRepository;
import com.everytable.api.store.service.StoreService;
import com.everytable.api.store.vo.StoreVO;
import com.everytable.api.util.page.PageObject;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reservation")
@RequiredArgsConstructor
public class ReservationRestController {

    private final ReservationService reservationService;
    private final StoreService       storeService;
    private final StoreRepository    storeRepository;   // 최소 주문금액 조회용
    private final OrdersRepository   ordersRepository;  // 개인 요청사항 취합용
    private final MenuRepository     menuRepository;    // 메뉴명 조회용

    private String currentLoginId(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof MemberUserDetails details)) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return details.getUsername();
    }

    private Long currentUserNo(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof MemberUserDetails details)) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return details.getMember().getNo();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private void checkOwner(Long storeNo, Authentication authentication) {
        StoreVO store = storeService.view(storeNo);
        if (!store.getOwnerNo().equals(currentUserNo(authentication))) {
            throw new RuntimeException("본인 매장의 예약/주문만 관리할 수 있습니다.");
        }
    }

    @GetMapping("/list.do")
    public Map<String, Object> list(HttpServletRequest request, Authentication authentication) {
        PageObject pageObject = PageObject.getInstance(request);
        Map<String, Object> result = new HashMap<>();
        result.put("list",       reservationService.list(currentLoginId(authentication), pageObject));
        result.put("pageObject", pageObject);
        return result;
    }

    @GetMapping("/adminList.do")
    public Map<String, Object> adminList(@RequestParam Long storeNo,
                                         HttpServletRequest request,
                                         Authentication authentication) {
        checkOwner(storeNo, authentication);
        PageObject pageObject = PageObject.getInstance(request);
        Map<String, Object> result = new HashMap<>();
        result.put("list",       reservationService.adminList(storeNo, pageObject));
        result.put("pageObject", pageObject);
        return result;
    }

    @GetMapping("/adminListAll.do")
    public Map<String, Object> adminListAll(HttpServletRequest request, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        PageObject pageObject = PageObject.getInstance(request);
        Map<String, Object> result = new HashMap<>();
        List<ReservationVO> list = isAdmin
                ? reservationService.adminListAllForAdmin(pageObject)
                : reservationService.adminListAll(currentUserNo(authentication), pageObject);
        result.put("list",       list);
        result.put("pageObject", pageObject);
        return result;
    }

    @GetMapping("/view.do")
    public ReservationVO view(@RequestParam Long no) {
        return reservationService.view(no);
    }

    @PostMapping("/write.do")
    public Map<String, Object> write(@RequestBody ReservationVO vo, Authentication authentication) {
        vo.setUserNo(currentUserNo(authentication));
        Long resNo = reservationService.write(vo);
        return Map.of("resNo", resNo, "storeNo", vo.getStoreNo());
    }

    @PostMapping("/update.do")
    public Map<String, Object> update(@RequestBody ReservationUpdateRequest req) {
        ReservationVO vo = new ReservationVO();
        vo.setResNo(req.resNo);
        vo.setResPhone(req.resPhone);
        vo.setResDate(req.resDate);
        vo.setResTime(req.resTime);
        vo.setResCount(req.resCount);
        vo.setResType(req.resType);
        vo.setOrderAdd(req.orderAdd);
        vo.setTotalPrice(req.totalPrice);
        int result = reservationService.update(vo, req.menuNos, req.quantities, req.prices, req.ops);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/adminUpdate.do")
    public Map<String, Object> adminUpdate(@RequestBody Map<String, Object> body,
                                           Authentication authentication) {
        Long   resNo        = Long.valueOf(body.get("resNo").toString());
        Long   resStatus    = Long.valueOf(body.get("resStatus").toString());
        String cancelReason = body.get("cancelReason") == null ? null : body.get("cancelReason").toString();
        checkOwner(reservationService.view(resNo).getStoreNo(), authentication);
        int result = reservationService.adminUpdate(resNo, resStatus, cancelReason);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/adminCancel.do")
    public Map<String, Object> adminCancel(@RequestBody Map<String, Object> body,
                                           Authentication authentication) {
        Long   resNo        = Long.valueOf(body.get("resNo").toString());
        String cancelReason = body.get("cancelReason") == null ? null : body.get("cancelReason").toString();
        checkOwner(reservationService.view(resNo).getStoreNo(), authentication);
        int result = reservationService.adminCancel(resNo, cancelReason);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/userCancel.do")
    public Map<String, Object> userCancel(@RequestBody Map<String, Object> body,
                                          Authentication authentication) {
        Long   resNo        = Long.valueOf(body.get("resNo").toString());
        String cancelReason = body.get("cancelReason") == null ? null : body.get("cancelReason").toString();
        ReservationVO vo = reservationService.view(resNo);
        if (!vo.getUserNo().equals(currentUserNo(authentication))) {
            throw new RuntimeException("본인 예약만 취소할 수 있습니다.");
        }
        int result = reservationService.userCancel(resNo, cancelReason);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/cancelRequest.do")
    public Map<String, Object> cancelRequest(@RequestBody Map<String, Object> body,
                                             Authentication authentication) {
        Long   resNo        = Long.valueOf(body.get("resNo").toString());
        String cancelReason = body.get("cancelReason") == null ? null : body.get("cancelReason").toString();
        ReservationVO vo = reservationService.view(resNo);
        if (!vo.getUserNo().equals(currentUserNo(authentication))) {
            throw new RuntimeException("본인 예약만 취소 요청할 수 있습니다.");
        }
        int result = reservationService.cancelRequest(resNo, cancelReason);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/cancelApprove.do")
    public Map<String, Object> cancelApprove(@RequestBody Map<String, Object> body,
                                             Authentication authentication) {
        Long resNo = Long.valueOf(body.get("resNo").toString());
        checkOwner(reservationService.view(resNo).getStoreNo(), authentication);
        int result = reservationService.cancelApprove(resNo);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @PostMapping("/cancelReject.do")
    public Map<String, Object> cancelReject(@RequestBody Map<String, Object> body,
                                            Authentication authentication) {
        Long   resNo        = Long.valueOf(body.get("resNo").toString());
        String rejectReason = body.get("rejectReason") == null ? null : body.get("rejectReason").toString();
        checkOwner(reservationService.view(resNo).getStoreNo(), authentication);
        int result = reservationService.cancelReject(resNo, rejectReason);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    @GetMapping("/groupMenuForm.do")
    public Map<String, Object> groupMenuForm(@RequestParam Long resNo) {
        return reservationService.groupMenuForm(resNo);
    }

    @PostMapping("/groupOrderWrite.do")
    public Map<String, Object> groupOrderWrite(@RequestBody GroupOrderWriteRequest req) {
        reservationService.groupOrderWrite(req.resNo, req.menuNos, req.quantities, req.adds, req.ops);        return Map.of("result", "ok");
    }

    @GetMapping("/groupOrderStatus.do")
    public Map<String, Object> groupOrderStatus(@RequestParam Long resNo) {
        // orderList에 op/adds 이미 포함 (menuNo+op 기준 그룹핑, adds 중복 제거)
        List<OrdersVO> orderList = reservationService.groupOrderList(resNo);
        Long total = reservationService.groupOrderTotal(resNo);

        // 최소 주문금액 조회
        ReservationVO resVO = reservationService.view(resNo);
        int minOrderPrice = storeRepository.findById(resVO.getStoreNo())
                .map(s -> s.getMinOrderPrice())
                .orElse(0);

        Map<String, Object> result = new HashMap<>();
        result.put("orderList",     orderList);
        result.put("total",         total);
        result.put("resNo",         resNo);
        result.put("minOrderPrice", minOrderPrice);
        return result;
    }

    @PostMapping("/finalOrder.do")
    public Map<String, Object> finalOrder(@RequestBody Map<String, Object> body) {
        Long   resNo    = Long.valueOf(body.get("resNo").toString());
        String orderAdd = body.get("orderAdd") == null ? null : body.get("orderAdd").toString();
        return reservationService.finalOrder(resNo, orderAdd);
    }

    @GetMapping("/storeMenuList.do")
    public List<MenuVO> storeMenuList(@RequestParam Long storeNo) {
        return reservationService.storeMenuList(storeNo);
    }

    // ── Request DTO ──────────────────────────────────────────

    public static class ReservationUpdateRequest {
        public Long         resNo;
        public String       resPhone;
        public String       resDate;
        public String       resTime;
        public Long         resCount;
        public String       resType;
        public String       orderAdd;
        public Long         totalPrice;
        public List<Long>   menuNos;
        public List<Long>   quantities;
        public List<Long>   prices;
        public List<String> ops;  // 메뉴별 선택된 옵션 문자열
    }

    public static class GroupOrderWriteRequest {
        public Long         resNo;
        public List<Long>   menuNos;
        public List<Long>   quantities;
        public List<String> adds;  // 메뉴별 개인 요청사항
        public List<String> ops;
    }
}