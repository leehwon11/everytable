package com.everytable.api.reservation.service;

import com.everytable.api.menu.vo.MenuVO;
import com.everytable.api.reservation.vo.OrdersVO;
import com.everytable.api.reservation.vo.ReservationVO;
import com.everytable.api.util.page.PageObject;

import java.util.List;
import java.util.Map;

/**
 * res_status 값 (재정의):
 *   1: 결제 전 (예약 생성, 점주 확인 대기)
 *   2: 예약 승인 (점주 승인 완료)
 *   3: 완료 (이용 완료, 이 상태부터 취소 불가)
 *   4: 취소 처리 중 (유저 취소 요청 / 점주 거절 포함)
 *   5: 취소 (최종 취소 완료)
 */
public interface ReservationService {

    List<ReservationVO> list(String loginId, PageObject pageObject);

    List<ReservationVO> adminList(Long storeNo, PageObject pageObject);

    /** 다중 매장 전체 주문 관리 */
    List<ReservationVO> adminListAll(Long ownerNo, PageObject pageObject);

    // 관리자 전용: 매장 구분 없이 전체 예약 조회
    List<ReservationVO> adminListAllForAdmin(PageObject pageObject);

    ReservationVO view(Long resNo);

    Long write(ReservationVO vo);

    int update(ReservationVO vo, List<Long> menuNos, List<Long> quantities, List<Long> prices, List<String> ops);

    /** [점주] 상태 직접 변경 (승인:2, 완료:3) */
    int adminUpdate(Long resNo, Long resStatus, String cancelReason);

    /** [점주] 신규 접수 거절 → status=5 (최종 취소) */
    int adminCancel(Long resNo, String cancelReason);

    /** [유저] 결제 전(1) 직접 취소 → status=5 */
    int userCancel(Long resNo, String cancelReason);

    /** [유저] 취소 요청 → status=4 (취소 처리 중). 완료(3) 이후엔 불가 */
    int cancelRequest(Long resNo, String cancelReason);

    /** [점주] 취소 승인 → status=5 (최종 취소) */
    int cancelApprove(Long resNo);

    /** [점주] 취소 거절 → status=2 (승인 상태로 복귀) + 거절 사유 저장 */
    int cancelReject(Long resNo, String rejectReason);

    Map<String, Object> groupMenuForm(Long resNo);

    void groupOrderWrite(Long resNo, List<Long> menuNos, List<Long> quantities, List<String> addsList, List<String> ops);

    List<OrdersVO> groupOrderList(Long resNo);

    Long groupOrderTotal(Long resNo);

    Map<String, Object> finalOrder(Long resNo, String orderAdd);

    List<MenuVO> storeMenuList(Long storeNo);
}