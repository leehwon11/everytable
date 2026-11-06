package com.everytable.api.member.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 원본 Oracle JOB_PURGE_WITHDRAWN 배치가 개인정보 파기 시점에 기록을 남기던 백업 테이블.
 * DB 레벨 스케줄러였어서 서블릿 Java 소스에는 대응 코드가 없었다 (MemberScheduledTasks 참고).
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "withdrawn_member_backup")
public class WithdrawnMemberBackup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long withdrawNo;

    @Column(nullable = false, unique = true)
    private Long userNo;

    @Column(nullable = false)
    private LocalDate joinDate;

    @Column(nullable = false)
    private LocalDate withdrawDate;

    @Builder.Default
    private LocalDateTime purgeDate = LocalDateTime.now();
}
