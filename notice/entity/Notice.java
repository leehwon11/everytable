package com.everytable.api.notice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 원본 everytable.notice.vo.NoticeVO + notice 테이블 이식.
 *
 * 팀 최종 스키마 반영: PK가 notice_no로, 작성자 컬럼이 writer(String, 로그인 아이디) 대신
 * admin_no(Long, member.member_no FK)로 바뀌었다. cate_no는 이제 notice_cate 테이블을
 * 참조하는 실제 FK라서, 카테고리 이름은 더 이상 여기서 하드코딩하지 않고
 * NoticeServiceImpl이 NoticeCateRepository로 조회해서 채운다.
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "notice")
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long noticeNo;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 1000)
    private String content;

    // 첨부 이미지 URL 경로 (예: /upload/notice/xxx.png), 없으면 null
    @Column(length = 100)
    private String image;

    // member.member_no(FK) 참조. writerId(로그인 아이디) <-> admin_no 변환은 NoticeServiceImpl이 처리.
    @Column(nullable = false)
    private Long adminNo;

    @Column(nullable = false)
    private Integer cateNo;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime writeDate;

    @LastModifiedDate
    private LocalDateTime updateDate;

    @Builder.Default
    @Column(nullable = false)
    private Long hit = 0L;
}
