package com.everytable.api.store.service;

import com.everytable.api.store.vo.StoreVO;
import com.everytable.api.util.page.PageObject;

import java.util.List;
import java.util.Map;

public interface StoreService {
    StoreVO write(StoreVO vo);
    StoreVO view(Long storeNo);
    // 로그인 아이디로 매장 1개만 찾던 메서드 - 다중 매장 지원 후에도 menu/reservation/review
    // 컨트롤러가 아직 "내 매장은 하나"라고 가정하고 쓰고 있어서 당장은 그대로 둔다(후속 작업 필요).
    StoreVO findByMemberId(String memberId);
    // 다중 매장 지원: 로그인한 점주가 가진 매장 전체 목록
    List<StoreVO> myStores(Long ownerNo);
    int update(StoreVO vo);
    Map<String, Object> list(PageObject pageObject);
    // 관리자 전용: 전체 매장 목록 (통계 화면 매장 선택 드롭다운용)
    List<StoreVO> allStores();
    // 이번달 생성된 예약(주문) 건수(취소 제외)가 많은 순으로 상위 limit개 매장
    Map<String, Object> listTopMonthly(int limit);
}