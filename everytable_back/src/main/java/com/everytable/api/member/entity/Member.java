package com.everytable.api.member.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 원본 everytable.member.vo.MemberVO + member 테이블을 JPA 엔티티로 이식.
 *
 * 원본은 Oracle sequence(member_seq)로 no를 채번했다. 여기서는 MariaDB AUTO_INCREMENT로 대체.
 * 로그인 아이디는 DB 컬럼명 "id" 그대로 유지하되, Spring Data JPA의 findById(PK)와
 * 이름이 충돌하지 않도록 자바 필드명은 loginId 로 두고 @Column(name="id")로 매핑했다.
 *
 * grade_no -> 권한(role) 매핑 (원본 MemberController의 gradeName 분기와 동일)
 *   1 : 일반회원 (ROLE_USER)
 *   2 : 매장점주 (ROLE_OWNER)
 *   9 : 관리자   (ROLE_ADMIN)
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "member")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_no")
    private Long no;

    @Column(name = "id", nullable = false, unique = true, length = 20)
    private String loginId;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false, length = 100)
    private String pw;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(length = 15)
    private String gender;

    private LocalDate birth;

    @Column(length = 13)
    private String tel;

    @Column(nullable = false, length = 50)
    private String email;

    // 정상 / 휴면 / 정지 / 탈퇴 / 파기
    @Builder.Default
    @Column(nullable = false, length = 10)
    private String status = "정상";

    // 1: 일반회원, 2: 매장점주, 9: 관리자 (grade 테이블 FK)
    @Builder.Default
    @Column(nullable = false)
    private Integer gradeNo = 1;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime joinDate;

    private LocalDateTime lastLogin;

    @Column(name = "sus_end_date")
    private LocalDate suspensionEndDate;

    private LocalDate withdrawDate;

    // DB 컬럼이 아니라 gradeNo 로부터 계산되는 값
    @Transient
    public String getGradeName() {
        if (gradeNo == null) return "일반회원";
        return switch (gradeNo) {
            case 2 -> "매장점주";
            case 9 -> "관리자";
            default -> "일반회원";
        };
    }

    @Transient
    public List<String> getRoles() {
        List<String> roles = new ArrayList<>();
        if (gradeNo != null && gradeNo == 9) roles.add("ROLE_ADMIN");
        if (gradeNo != null && gradeNo == 2) roles.add("ROLE_OWNER");
        roles.add("ROLE_USER");
        return roles;
    }
}
