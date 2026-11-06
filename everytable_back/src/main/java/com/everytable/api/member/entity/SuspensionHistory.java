package com.everytable.api.member.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 원본 everytable.member.vo.SuspensionHistoryVO + suspension_history 테이블 이식.
// 팀 최종 스키마에서 user_id/admin_id(로그인 아이디 문자열) 대신 user_no/admin_no(member_no FK)로
// 바뀌어서, 로그인 아이디를 직접 저장하지 않고 회원번호(Long)를 저장한다 (MemberServiceImpl에서 조회 후 세팅).
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "suspension_history")
public class SuspensionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long susNo;

    @Column(nullable = false)
    private Long userNo;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(length = 1000)
    private String reason;

    @Column(nullable = false)
    private Long adminNo;
}
