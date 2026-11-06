package com.everytable.api.notice.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 원본 everytable.notice.vo.NoticeVO 이식
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NoticeVO {
    private Long noticeNo;
    private String title;
    private String content;
    private String fileName; // 이미지 URL 경로
    private Long writerNo;
    private String writerName;
    private String writeDate;  // yyyy-MM-dd HH:mm
    private String updateDate; // yyyy-MM-dd HH:mm
    private Integer cateNo;
    private String cateName;
    private Long hit;
}
