package com.everytable.api.member.schedule;

import com.everytable.api.member.entity.Member;
import com.everytable.api.member.entity.WithdrawnMemberBackup;
import com.everytable.api.member.repository.MemberRepository;
import com.everytable.api.member.repository.WithdrawnMemberBackupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 원본은 Oracle DBMS_SCHEDULER로 매일 새벽 3시에 3개 배치(JOB_SET_DORMANT,
 * JOB_RELEASE_SUSPENSION, JOB_PURGE_WITHDRAWN)를 돌렸다. DB 레벨 스케줄러라 서블릿
 * Java 소스만으로는 존재를 알 수 없었던 부분 - 사용자가 원본 SQL을 공유해줘서 확인 후 이식.
 */
@Component
@RequiredArgsConstructor
@Log4j2
public class MemberScheduledTasks {

    private final MemberRepository memberRepository;
    private final WithdrawnMemberBackupRepository withdrawnMemberBackupRepository;

    // ① 휴면 처리: 매일 새벽 3시, 최근 로그인 30일 초과한 정상 회원 -> 휴면
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void setDormantMembers() {
        int updated = memberRepository.bulkSetDormant(LocalDateTime.now().minusDays(30));
        if (updated > 0) log.info("[스케줄러] 휴면 전환 {}명 처리", updated);
    }

    // ② 정지 해제: 매일 새벽 3시, 정지 기간이 끝난 회원 -> 정상
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void releaseSuspendedMembers() {
        int updated = memberRepository.bulkReleaseSuspension(LocalDate.now());
        if (updated > 0) log.info("[스케줄러] 정지 해제 {}명 처리", updated);
    }

    // ③ 개인정보 파기: 매일 새벽 3시, 탈퇴 후 5년(60개월) 지난 회원
    //    -> withdrawn_member_backup에 기록 남기고 개인정보 익명화 + 상태를 '파기'로 변경
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeWithdrawnMembers() {
        LocalDate cutoff = LocalDate.now().minusMonths(60);
        List<Member> targets = memberRepository.findWithdrawnBefore(cutoff);
        int purged = 0;
        for (Member m : targets) {
            if (withdrawnMemberBackupRepository.existsByUserNo(m.getNo())) continue; // 이미 백업된 회원은 건너뜀

            WithdrawnMemberBackup backup = WithdrawnMemberBackup.builder()
                    .userNo(m.getNo())
                    .joinDate(m.getJoinDate().toLocalDate())
                    .withdrawDate(m.getWithdrawDate())
                    .build();
            withdrawnMemberBackupRepository.save(backup);

            m.setName("탈퇴한 회원");
            m.setBirth(null);
            m.setGender(null);
            m.setTel(null);
            m.setEmail("-");
            m.setPw("DELETED_USER_" + UUID.randomUUID());
            m.setStatus("파기");
            purged++;
        }
        if (purged > 0) log.info("[스케줄러] 개인정보 파기 {}명 처리", purged);
    }
}
