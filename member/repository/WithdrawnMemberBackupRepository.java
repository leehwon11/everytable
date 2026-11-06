package com.everytable.api.member.repository;

import com.everytable.api.member.entity.WithdrawnMemberBackup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WithdrawnMemberBackupRepository extends JpaRepository<WithdrawnMemberBackup, Long> {
    boolean existsByUserNo(Long userNo);
}
