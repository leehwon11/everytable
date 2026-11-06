package com.everytable.api.menu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

// 원본 everytable.menu.vo.MenuVO + menu 테이블 이식
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "menu")
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long menuNo;

    @Column(nullable = false)
    private Long storeNo;

    @Column(nullable = false, length = 100)
    private String menuName;

    @Column(nullable = false)
    private int price;

    @Column(length = 500)
    private String description;

    private String imageUrl;

    // 1: 판매중, 0: 품절
    @Builder.Default
    @Column(nullable = false)
    private int isActive = 1;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdDate;
}
