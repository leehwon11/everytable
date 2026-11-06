package com.everytable.api.payment.repository;

import com.everytable.api.payment.entity.Payment;;
import com.everytable.api.payment.vo.DailyPaymentStatVO;

import java.time.LocalDate;
import java.util.List;

// 원본 PaymentDAO.search()/searchDataSet() 을 QueryDSL로 재구현
// key: "m"(결제수단)/"s"(상태)/"u"(아이디) 조합 문자열, word: 검색어 (like 검색)
//
// enforcedUserId: 관리자가 아닌 일반 사용자는 본인 결제 내역만 볼 수 있어야 하므로,
// (원본 컨트롤러가 key/word를 강제로 "u"/로그인id로 덮어써서 우회하던 방식 대신)
// 검색 조건과는 별개의 필수 AND 조건으로 강제한다. 관리자는 null을 전달해 전체 조회.
public interface PaymentRepositoryCustom {

    List<Payment> search(String key, String word, String enforcedUserId, long offset, long limit);

    long searchCount(String key, String word, String enforcedUserId);

    // stats 도메인 "오늘 요약" 용 - storeNos가 null이면 매장 조건 없이 전체 대상(관리자).
    // 빈 리스트(카테고리/지역 필터에 걸리는 매장이 0개)를 넘기면 안 되고, 그 경우 호출부에서
    // 쿼리를 아예 생략하고 0을 반환하도록 처리해야 한다 (JPQL이 빈 IN절을 지원하지 않음).
    Long todaySalesSum(List<Long> storeNos, LocalDate date);

    Long todayOrderCount(List<Long> storeNos, LocalDate date);

    // stats 도메인 "일별 통계"/"기간별 조회" 용 - 날짜별 매출/건수 집계 (최신 날짜순, 페이지네이션)
    List<DailyPaymentStatVO> aggregateDaily(List<Long> storeNos, LocalDate startDate, LocalDate endDate, long offset, long limit);

    // aggregateDaily와 동일 조건으로 집계되는 "날짜" 개수 (페이지네이션 total 계산용)
    long aggregateDailyGroupCount(List<Long> storeNos, LocalDate startDate, LocalDate endDate);

    // stats 도메인 "기간별 조회" 상단 합계 매출
    Long sumAmountInRange(List<Long> storeNos, LocalDate startDate, LocalDate endDate);
}