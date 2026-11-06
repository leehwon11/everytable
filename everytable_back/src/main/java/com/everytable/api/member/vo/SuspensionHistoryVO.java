package com.everytable.api.member.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 원본 everytable.member.vo.SuspensionHistoryVO 이식
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuspensionHistoryVO {
    private Long susNo;
    private Long userNo;
    private String startDate;
    private String endDate;
    private String reason;
    private Long adminNo;
    private String adminName;
}
