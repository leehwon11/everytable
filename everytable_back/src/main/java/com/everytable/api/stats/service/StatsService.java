package com.everytable.api.stats.service;

import com.everytable.api.util.page.PageObject;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface StatsService {

    // storeNos: null=전체(조건 없음), 빈 리스트=대상 매장 0개(결과도 0), 그 외=해당 매장들만 집계
    Map<String, Object> dashboard(List<Long> storeNos, PageObject pageObject);

    Map<String, Object> salesPeriod(List<Long> storeNos, LocalDate startDate, LocalDate endDate, PageObject pageObject);
}