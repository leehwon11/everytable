package com.everytable.api.reservation.service;

import com.everytable.api.payment.repository.PaymentRepository;
import com.everytable.api.payment.service.PaymentService;
import com.everytable.api.review.repository.ReviewRepository;
import com.everytable.api.member.entity.Member;
import com.everytable.api.member.repository.MemberRepository;
import com.everytable.api.menu.entity.Menu;
import com.everytable.api.menu.repository.MenuRepository;
import com.everytable.api.menu.vo.MenuVO;
import com.everytable.api.reservation.entity.Orders;
import com.everytable.api.reservation.entity.Reservation;
import com.everytable.api.reservation.repository.OrdersRepository;
import com.everytable.api.reservation.repository.ReservationRepository;
import com.everytable.api.reservation.repository.ReservationRepositoryCustom;
import com.everytable.api.reservation.vo.OrdersVO;
import com.everytable.api.reservation.vo.ReservationVO;
import com.everytable.api.store.entity.Store;
import com.everytable.api.store.repository.StoreRepository;
import com.everytable.api.util.page.PageObject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.HashSet;
import java.util.stream.Collectors;

/**
 * res_status:
 *   1=결제 전(대기), 2=예약 승인, 3=완료(취소 불가), 4=취소 처리 중, 5=취소(최종)
 */
@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private static final DateTimeFormatter DATE_FMT     = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ReservationRepository       reservationRepository;
    private final ReservationRepositoryCustom reservationRepositoryCustom;
    private final OrdersRepository            ordersRepository;
    private final MenuRepository              menuRepository;
    private final StoreRepository             storeRepository;
    private final MemberRepository            memberRepository;
    private final ReviewRepository            reviewRepository;
    private final PaymentRepository           paymentRepository;
    private final PaymentService              paymentService;

    // ── 1. 사용자 본인 예약 목록 ──────────────────────────────

    @Override
    public List<ReservationVO> list(String loginId, PageObject pageObject) {
        Long userNo = findMemberNoByLoginId(loginId);
        long total = reservationRepositoryCustom.searchByUserCount(userNo, pageObject.getKey());
        pageObject.setTotalRow(total);
        List<Reservation> list = reservationRepositoryCustom.searchByUser(
                userNo, pageObject.getKey(),
                pageObject.getLimit(), pageObject.getPerPageNum());
        return toVOListBatch(list, false);
    }

    // ── 1-1. 매장(점주) 주문 관리 목록 ───────────────────────

    @Override
    public List<ReservationVO> adminList(Long storeNo, PageObject pageObject) {
        long total = reservationRepositoryCustom.searchByStoreCount(storeNo, pageObject.getKey());
        pageObject.setTotalRow(total);
        List<Reservation> list = reservationRepositoryCustom.searchByStore(
                storeNo, pageObject.getKey(),
                pageObject.getLimit(), pageObject.getPerPageNum());
        return toVOListBatch(list, true);
    }

    // 관리자 전용: 매장 구분 없이 전체 예약 조회
    @Override
    public List<ReservationVO> adminListAllForAdmin(PageObject pageObject) {
        long total = reservationRepositoryCustom.searchAllCount(pageObject.getKey());
        pageObject.setTotalRow(total);
        List<Reservation> list = reservationRepositoryCustom.searchAll(
                pageObject.getKey(), pageObject.getLimit(), pageObject.getPerPageNum());
        return toVOListBatch(list, true);
    }

    // ── 1-2. 다중 매장 전체 주문 관리 목록 ───────────────────

    @Override
    public List<ReservationVO> adminListAll(Long ownerNo, PageObject pageObject) {
        List<Long> storeNos = storeRepository.findAllByOwnerNo(ownerNo).stream()
                .map(Store::getStoreNo)
                .toList();
        if (storeNos.isEmpty()) {
            pageObject.setTotalRow(0);
            return new ArrayList<>();
        }
        long total = reservationRepositoryCustom.searchByStoreInCount(storeNos, pageObject.getKey());
        pageObject.setTotalRow(total);
        List<Reservation> list = reservationRepositoryCustom.searchByStoreIn(
                storeNos, pageObject.getKey(), pageObject.getLimit(), pageObject.getPerPageNum());
        return toVOListBatch(list, true);
    }

    // ── 2. 예약 상세 ──────────────────────────────────────────

    @Override
    public ReservationVO view(Long resNo) {
        Reservation r = findReservation(resNo);
        ReservationVO vo = toVO(r, true);
        vo.setOrderList(orderList(resNo));
        return vo;
    }

    // ── 3. 예약 등록 ──────────────────────────────────────────

    @Override
    @Transactional
    public Long write(ReservationVO vo) {
        Store store = storeRepository.findById(vo.getStoreNo())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 매장입니다."));
        if (store.getOwnerNo().equals(vo.getUserNo())) {
            throw new RuntimeException("본인이 운영하는 매장은 예약할 수 없습니다.");
        }
        Reservation reservation = Reservation.builder()
                .userNo(vo.getUserNo())
                .storeNo(vo.getStoreNo())
                .resDate(LocalDate.parse(vo.getResDate(), DATE_FMT))
                .resTime(vo.getResTime())
                .resCount(vo.getResCount())
                .resPhone(stripPhone(vo.getResPhone()))
                .resType(vo.getResType())
                .totalPrice(0L)
                .resStatus(1L)
                .build();
        return reservationRepository.save(reservation).getResNo();
    }

    // ── 4. 예약 수정 ──────────────────────────────────────────

    @Override
    @Transactional
    public int update(ReservationVO vo, List<Long> menuNos, List<Long> quantities, List<Long> prices, List<String> ops) {
        Reservation r = findReservation(vo.getResNo());
        if (r.getResStatus() != 1L) {
            throw new RuntimeException("결제 전 상태의 예약만 수정할 수 있습니다.");
        }
        r.setResDate(LocalDate.parse(vo.getResDate(), DATE_FMT));
        r.setResTime(vo.getResTime());
        r.setResCount(vo.getResCount());
        r.setResPhone(stripPhone(vo.getResPhone()));
        r.setResType(vo.getResType());
        r.setOrderAdd(vo.getOrderAdd());
        r.setTotalPrice(vo.getTotalPrice());
        reservationRepository.save(r);

        ordersRepository.deleteByResNo(vo.getResNo());
        if (menuNos != null && quantities != null && prices != null) {
            for (int i = 0; i < menuNos.size(); i++) {
                Long qty = quantities.get(i);
                if (qty == null || qty <= 0) continue;
                String op = (ops != null && i < ops.size()) ? ops.get(i) : null;
                ordersRepository.save(Orders.builder()
                        .resNo(vo.getResNo())
                        .menuNo(menuNos.get(i))
                        .quantity(qty)
                        .price(prices.get(i))
                        .op(op)
                        .build());
            }
        }
        // 💡 [수정] 공백(" ") 대신 "T"를 넣어 ISO 포맷("2026-07-23T11:10")으로 전달
        if (paymentRepository.existsByResNo(vo.getResNo())) {
            String pickupDateTime = vo.getResDate() + "T" + vo.getResTime();
            paymentService.updatePaymentByResNo(vo.getResNo(), vo.getTotalPrice(), pickupDateTime);
        }
        return 1;
    }

    // ── 5. [점주] 상태 변경 ───────────────────────────────────

    @Override
    @Transactional
    public int adminUpdate(Long resNo, Long resStatus, String cancelReason) {
        Reservation r = findReservation(resNo);
        r.setResStatus(resStatus);
        r.setCancelReason(cancelReason);
        reservationRepository.save(r);

        if (resStatus != null && resStatus == 2L) {
            try {
                paymentService.approveByResNo(resNo);
            } catch (Exception e) {
                // 결제 수단 미등록 등 예외는 무시
            }
        }
        return 1;
    }

    // ── 6. [점주] 신규 접수 거절 → status=5 ──────────────────

    @Override
    @Transactional
    public int adminCancel(Long resNo, String cancelReason) {
        Reservation r = findReservation(resNo);
        r.setResStatus(5L);
        r.setCancelReason(cancelReason);
        reservationRepository.save(r);
        return 1;
    }

    // ── 7. [유저] 결제 전(1) 직접 취소 → status=5 ───────────

    @Override
    @Transactional
    public int userCancel(Long resNo, String cancelReason) {
        Reservation r = findReservation(resNo);
        if (r.getResStatus() != 1L) {
            throw new RuntimeException("결제 전 상태의 예약만 직접 취소할 수 있습니다.");
        }
        r.setResStatus(5L);
        r.setCancelReason(cancelReason);
        reservationRepository.save(r);
        return 1;
    }

    // ── 8. [유저] 취소 요청 → status=4 ──────────────────────

    @Override
    @Transactional
    public int cancelRequest(Long resNo, String cancelReason) {
        Reservation r = findReservation(resNo);
        if (r.getResStatus() == 3L) {
            throw new RuntimeException("이용 완료된 예약은 취소할 수 없습니다.");
        }
        if (r.getResStatus() == 4L || r.getResStatus() == 5L) {
            throw new RuntimeException("이미 취소 처리 중이거나 취소된 예약입니다.");
        }
        r.setResStatus(4L);
        r.setCancelReason(cancelReason);
        reservationRepository.save(r);
        return 1;
    }

    // ── 9. [점주] 취소 승인 → status=5 ──────────────────────

    @Override
    @Transactional
    public int cancelApprove(Long resNo) {
        Reservation r = findReservation(resNo);
        if (r.getResStatus() != 4L) {
            throw new RuntimeException("취소 처리 중인 예약만 승인할 수 있습니다.");
        }
        r.setResStatus(5L);
        reservationRepository.save(r);
        try {
            paymentService.refundByResNo(resNo);
        } catch (Exception e) {
            // 무시
        }
        return 1;
    }

    // ── 10. [점주] 취소 거절 → status=2 ─────────────────────

    @Override
    @Transactional
    public int cancelReject(Long resNo, String rejectReason) {
        Reservation r = findReservation(resNo);
        if (r.getResStatus() != 4L) {
            throw new RuntimeException("취소 처리 중인 예약만 거절할 수 있습니다.");
        }
        r.setResStatus(2L);
        r.setCancelReason(rejectReason);
        reservationRepository.save(r);
        return 1;
    }

    // ── 11. 단체주문 - 참여자 메뉴선택 폼 데이터 ──────────────

    @Override
    public Map<String, Object> groupMenuForm(Long resNo) {
        ReservationVO vo = view(resNo);
        Map<String, Object> result = new HashMap<>();
        result.put("vo", vo);
        result.put("menuList", storeMenuList(vo.getStoreNo()));
        return result;
    }

    // ── 12. 단체주문 - 참여자 메뉴 저장 ─────────────────────

    @Override
    @Transactional
    public void groupOrderWrite(Long resNo, List<Long> menuNos, List<Long> quantities, List<String> addsList, List<String> ops) {
        if (menuNos == null || quantities == null) return;
        for (int i = 0; i < menuNos.size(); i++) {
            Long qty = quantities.get(i);
            if (qty == null || qty <= 0) continue;
            Menu menu = menuRepository.findById(menuNos.get(i))
                    .orElseThrow(() -> new RuntimeException("존재하지 않는 메뉴입니다."));
            String op   = (ops      != null && i < ops.size())      ? ops.get(i)      : null;
            String adds = (addsList != null && i < addsList.size())  ? addsList.get(i) : null;
            ordersRepository.save(Orders.builder()
                    .resNo(resNo)
                    .menuNo(menu.getMenuNo())
                    .quantity(qty)
                    .price((long) menu.getPrice())
                    .adds(adds)
                    .op(op)
                    .build());
        }
    }

    // ── 13. 단체주문 취합 현황 ───────────────────────────────

    @Override
    public List<OrdersVO> groupOrderList(Long resNo) {
        List<Orders> items = ordersRepository.findByResNo(resNo);
        // menuNo + op 기준 그룹핑: 같은 메뉴+옵션 → 수량 합산, 다른 옵션 → 별개 행
        Map<String, OrdersVO> grouped = new LinkedHashMap<>();
        Map<String, Set<String>> addsSetMap = new LinkedHashMap<>();

        for (Orders item : items) {
            String menuName = menuRepository.findById(item.getMenuNo())
                    .map(Menu::getMenuName).orElse("메뉴#" + item.getMenuNo());
            String op  = item.getOp() == null ? "" : item.getOp().trim();
            String key = item.getMenuNo() + "__" + op;

            OrdersVO vo = grouped.computeIfAbsent(key, k -> {
                OrdersVO newVo = new OrdersVO();
                newVo.setMenuNo(item.getMenuNo());
                newVo.setMenuName(menuName);
                newVo.setPrice(item.getPrice());
                newVo.setOp(op.isBlank() ? null : op);
                newVo.setQuantity(0L);
                return newVo;
            });
            vo.setQuantity(vo.getQuantity() + item.getQuantity());

            if (item.getAdds() != null && !item.getAdds().isBlank()) {
                addsSetMap.computeIfAbsent(key, k -> new LinkedHashSet<>()).add(item.getAdds().trim());
            }
        }

        List<OrdersVO> result = new ArrayList<>(grouped.values());
        for (OrdersVO vo : result) {
            String key = vo.getMenuNo() + "__" + (vo.getOp() == null ? "" : vo.getOp());
            Set<String> addsSet = addsSetMap.get(key);
            if (addsSet != null && !addsSet.isEmpty()) {
                vo.setAdds(String.join(" / ", addsSet));
            }
        }
        return result;
    }

    @Override
    public Long groupOrderTotal(Long resNo) {
        return ordersRepository.findByResNo(resNo).stream()
                .mapToLong(item -> item.getPrice() * item.getQuantity()).sum();
    }

    // ── 14. 단체주문 확정 ────────────────────────────────────

    @Override
    @Transactional
    public Map<String, Object> finalOrder(Long resNo, String orderAdd) {
        Long totalPrice = groupOrderTotal(resNo);
        Reservation r   = findReservation(resNo);

        Store store = storeRepository.findById(r.getStoreNo())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 매장입니다."));
        if (store.getMinOrderPrice() > 0 && totalPrice < store.getMinOrderPrice()) {
            throw new RuntimeException(
                    "최소 주문금액(" + String.format("%,d", store.getMinOrderPrice()) + "원)을 충족하지 못했습니다. " +
                            "현재 주문금액: " + String.format("%,d", totalPrice) + "원");
        }

        r.setTotalPrice(totalPrice);
        r.setOrderAdd(orderAdd);
        reservationRepository.save(r);

        Map<String, Object> result = new HashMap<>();
        result.put("resNo",      resNo);
        result.put("storeNo",    r.getStoreNo());
        result.put("totalPrice", totalPrice);
        return result;
    }

    // ── 수정 폼용 매장 메뉴 목록 ─────────────────────────────

    @Override
    public List<MenuVO> storeMenuList(Long storeNo) {
        List<MenuVO> list = new ArrayList<>();
        for (Menu m : menuRepository.findByStoreNoAndIsActiveOrderByMenuNoAsc(storeNo, 1)) {
            list.add(new MenuVO(m.getMenuNo(), m.getStoreNo(), m.getMenuName(),
                    m.getPrice(), m.getDescription(), m.getImageUrl(), m.getIsActive()));
        }
        return list;
    }

    // ── private 헬퍼 ─────────────────────────────────────────

    /**
     * 목록 조회용 배치 변환.
     * 행마다 4번씩 조회하던 걸 → 4번의 IN 쿼리로 줄임.
     * 예약 10건 기준: 기존 40번 → 개선 후 4~5번
     */
    private List<ReservationVO> toVOListBatch(List<Reservation> list, boolean withUserName) {
        if (list.isEmpty()) return new ArrayList<>();

        // 필요한 ID 집합 수집
        Set<Long> userNos  = list.stream().map(Reservation::getUserNo).collect(Collectors.toSet());
        Set<Long> storeNos = list.stream().map(Reservation::getStoreNo).collect(Collectors.toSet());
        Set<Long> resNos   = list.stream().map(Reservation::getResNo).collect(Collectors.toSet());

        // 한 번에 조회 → Map으로 캐시
        Map<Long, String> memberNameMap = withUserName
                ? memberRepository.findAllById(userNos).stream()
                  .collect(Collectors.toMap(Member::getNo, Member::getName))
                : Collections.emptyMap();

        Map<Long, String> storeNameMap = storeRepository.findAllById(storeNos).stream()
                .collect(Collectors.toMap(Store::getStoreNo, Store::getStoreName));

        // 리뷰: resNo별 reviewNo (기존 메서드로 건별 조회 — review는 resNo UNIQUE라 N번이지만 허용)
        Map<Long, Long> reviewNoMap = new HashMap<>();
        for (Long resNo : resNos) {
            reviewRepository.findFirstByResNoOrderByReviewNoDesc(resNo)
                    .ifPresent(rv -> reviewNoMap.put(resNo, rv.getReviewNo()));
        }

        // 결제 존재 여부: 기존 메서드로 건별 조회
        Set<Long> paidResNos = new HashSet<>();
        for (Long resNo : resNos) {
            if (paymentRepository.existsByResNo(resNo)) paidResNos.add(resNo);
        }

        // 변환
        List<ReservationVO> result = new ArrayList<>();
        for (Reservation r : list) {
            ReservationVO vo = new ReservationVO();
            vo.setResNo(r.getResNo());
            vo.setResDate(r.getResDate() == null ? null : r.getResDate().format(DATE_FMT));
            vo.setResTime(r.getResTime());
            vo.setResCount(r.getResCount());
            vo.setResPhone(r.getResPhone());
            vo.setResStatus(r.getResStatus());
            vo.setStoreNo(r.getStoreNo());
            vo.setTotalPrice(r.getTotalPrice());
            vo.setCancelReason(r.getCancelReason());
            vo.setResCreatedAt(r.getResCreatedAt() == null ? null : r.getResCreatedAt().format(DATETIME_FMT));
            vo.setResType(r.getResType());
            vo.setOrderAdd(r.getOrderAdd());
            vo.setUserNo(r.getUserNo());
            vo.setUserName(memberNameMap.get(r.getUserNo()));
            vo.setStoreName(storeNameMap.get(r.getStoreNo()));
            vo.setReviewNo(reviewNoMap.get(r.getResNo()));
            vo.setHasPayment(paidResNos.contains(r.getResNo()));
            result.add(vo);
        }
        return result;
    }

    private Long findMemberNoByLoginId(String loginId) {
        return memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 회원입니다: " + loginId))
                .getNo();
    }

    private Reservation findReservation(Long resNo) {
        return reservationRepository.findById(resNo)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 예약입니다: " + resNo));
    }

    private String stripPhone(String phone) {
        return phone == null ? null : phone.replaceAll("[^0-9]", "");
    }

    private List<OrdersVO> orderList(Long resNo) {
        List<OrdersVO> list = new ArrayList<>();
        for (Orders item : ordersRepository.findByResNo(resNo)) {
            OrdersVO vo = new OrdersVO();
            vo.setOrdersNo(item.getOrdersNo());
            vo.setMenuNo(item.getMenuNo());
            menuRepository.findById(item.getMenuNo()).ifPresent(m -> vo.setMenuName(m.getMenuName()));
            vo.setQuantity(item.getQuantity());
            vo.setPrice(item.getPrice());
            vo.setAdds(item.getAdds());
            vo.setOp(item.getOp());
            list.add(vo);
        }
        return list;
    }

    // 상세 조회용 (단건이라 기존 방식 유지)
    private ReservationVO toVO(Reservation r, boolean withUserName) {
        ReservationVO vo = new ReservationVO();
        vo.setResNo(r.getResNo());
        vo.setResDate(r.getResDate() == null ? null : r.getResDate().format(DATE_FMT));
        vo.setResTime(r.getResTime());
        vo.setResCount(r.getResCount());
        vo.setResPhone(r.getResPhone());
        vo.setResStatus(r.getResStatus());
        vo.setStoreNo(r.getStoreNo());
        vo.setTotalPrice(r.getTotalPrice());
        vo.setCancelReason(r.getCancelReason());
        vo.setResCreatedAt(r.getResCreatedAt() == null ? null : r.getResCreatedAt().format(DATETIME_FMT));
        vo.setResType(r.getResType());
        vo.setOrderAdd(r.getOrderAdd());
        vo.setUserNo(r.getUserNo());
        if (withUserName) {
            memberRepository.findById(r.getUserNo()).ifPresent(m -> vo.setUserName(m.getName()));
        }
        storeRepository.findById(r.getStoreNo()).ifPresent(s -> vo.setStoreName(s.getStoreName()));
        reviewRepository.findFirstByResNoOrderByReviewNoDesc(r.getResNo())
                .ifPresent(review -> vo.setReviewNo(review.getReviewNo()));
        vo.setHasPayment(paymentRepository.existsByResNo(r.getResNo()));
        return vo;
    }
}