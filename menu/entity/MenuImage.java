package com.everytable.api.menu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 팀 최종 스키마에 새로 생긴 메뉴 이미지(다중 첨부) 테이블.
 * 지금까지는 menu.image_url 한 컬럼(문자열 URL)만 썼는데, 이 테이블은 실제 파일 업로드
 * (파일명/경로/크기)를 여러 장 저장하는 용도로 보인다. 원본과 지금까지의 변환 범위에는
 * 없던 기능이라 테이블 매핑만 만들어 뒀다 - 실제 업로드 API(FileStorageService 연동)가
 * 필요하면 별도로 요청해 달라.
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "menu_image")
public class MenuImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageNo;

    @Column(nullable = false)
    private Long menuNo;

    @Column(nullable = false, length = 100)
    private String fileName;

    @Column(nullable = false, length = 200)
    private String filePath;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false)
    private LocalDateTime uploadDate;
}
