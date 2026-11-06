package com.everytable.api.payment.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// stats 도메인에서 날짜별 매출 집계 결과를 담는 용도 (payment 테이블 기준)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyPaymentStatVO {
    private LocalDate statsDate;
    private Long orderCount;
    private Long totalSales;
}