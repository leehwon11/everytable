package com.everytable.api.stats.service;

import com.everytable.api.payment.repository.PaymentRepositoryCustom;
import com.everytable.api.payment.vo.DailyPaymentStatVO;
import com.everytable.api.util.page.PageObject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private final PaymentRepositoryCustom paymentRepositoryCustom;

    // 관리자 카테고리/지역 필터에 걸리는 매장이 0개일 때 (JPQL이 빈 IN절을 못 써서 쿼리 자체를 건너뛴다)
    private boolean isEmptyScope(List<Long> storeNos) {
        return storeNos != null && storeNos.isEmpty();
    }

    private List<Map<String, Object>> toRows(List<DailyPaymentStatVO> stats) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (DailyPaymentStatVO s : stats) {
            Map<String, Object> row = new HashMap<>();
            long orderCount = s.getOrderCount() == null ? 0 : s.getOrderCount();
            long totalSales = s.getTotalSales() == null ? 0 : s.getTotalSales();
            row.put("statsId", s.getStatsDate().toString());
            row.put("statsDate", s.getStatsDate().toString());
            row.put("orderCount", orderCount);
            row.put("totalSales", totalSales);
            row.put("avgOrder", orderCount == 0 ? 0 : (double) totalSales / orderCount);
            rows.add(row);
        }
        return rows;
    }

    @Override
    public Map<String, Object> dashboard(List<Long> storeNos, PageObject pageObject) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> today = new HashMap<>();

        if (isEmptyScope(storeNos)) {
            today.put("totalSales", 0L);
            today.put("orderCount", 0L);
            pageObject.setTotalRow(0);
            result.put("list", new ArrayList<>());
        } else {
            today.put("totalSales", paymentRepositoryCustom.todaySalesSum(storeNos, LocalDate.now()));
            today.put("orderCount", paymentRepositoryCustom.todayOrderCount(storeNos, LocalDate.now()));

            long total = paymentRepositoryCustom.aggregateDailyGroupCount(storeNos, null, null);
            pageObject.setTotalRow(total);
            List<DailyPaymentStatVO> stats = paymentRepositoryCustom.aggregateDaily(
                    storeNos, null, null, pageObject.getLimit(), pageObject.getPerPageNum());
            result.put("list", toRows(stats));
        }
        result.put("today", today);
        result.put("pageObject", pageObject);
        return result;
    }

    @Override
    public Map<String, Object> salesPeriod(List<Long> storeNos, LocalDate startDate, LocalDate endDate, PageObject pageObject) {
        Map<String, Object> result = new HashMap<>();

        if (isEmptyScope(storeNos)) {
            pageObject.setTotalRow(0);
            result.put("list", new ArrayList<>());
            result.put("totalSum", 0L);
        } else {
            long total = paymentRepositoryCustom.aggregateDailyGroupCount(storeNos, startDate, endDate);
            pageObject.setTotalRow(total);
            List<DailyPaymentStatVO> stats = paymentRepositoryCustom.aggregateDaily(
                    storeNos, startDate, endDate, pageObject.getLimit(), pageObject.getPerPageNum());
            result.put("list", toRows(stats));
            result.put("totalSum", paymentRepositoryCustom.sumAmountInRange(storeNos, startDate, endDate));
        }
        result.put("pageObject", pageObject);
        return result;
    }
}