package com.everytable.api.member.repository;

import com.everytable.api.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    // 로그인 아이디(loginId, DB 컬럼명 id)로 조회 - PK(no) 조회인 findById와 이름이 겹치지 않도록 별도 메서드로 정의
    Optional<Member> findByLoginId(String loginId);

    boolean existsByLoginId(String loginId);

    // 탈퇴한 회원의 연락처/이메일은 재사용할 수 있도록 상태가 '탈퇴'인 경우는 중복 체크에서 제외
    boolean existsByTelAndStatusNot(String tel, String status);

    boolean existsByEmailAndStatusNot(String email, String status);

    Optional<Member> findByNameAndEmailAndStatus(String name, String email, String status);

    Optional<Member> findByLoginIdAndEmail(String loginId, String email);

    // ------------------------------------------------------------
    // 원본 Oracle DBMS_SCHEDULER 배치 3종 이식 (MemberScheduledTasks 참고)
    // ------------------------------------------------------------

    // ① 휴면 처리: 정상 상태 + 최근 로그인이 cutoff 이전이면 휴면으로
    @Modifying
    @Query("UPDATE Member m SET m.status = '휴면' WHERE m.status = '정상' AND m.lastLogin < :cutoff")
    int bulkSetDormant(@Param("cutoff") LocalDateTime cutoff);

    // ② 정지 해제: 정지 상태 + 정지 종료일이 오늘 이하면 정상으로, 종료일은 초기화
    @Modifying
    @Query("UPDATE Member m SET m.status = '정상', m.suspensionEndDate = null " +
           "WHERE m.status = '정지' AND m.suspensionEndDate IS NOT NULL AND m.suspensionEndDate <= :today")
    int bulkReleaseSuspension(@Param("today") LocalDate today);

    // ③ 개인정보 파기 대상 조회: 탈퇴 상태 + 탈퇴일이 cutoff(5년 전) 이전
    @Query("SELECT m FROM Member m WHERE m.status = '탈퇴' AND m.withdrawDate IS NOT NULL AND m.withdrawDate < :cutoff")
    List<Member> findWithdrawnBefore(@Param("cutoff") LocalDate cutoff);
}
