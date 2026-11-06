package com.everytable.api.member.repository;

import com.everytable.api.member.entity.SuspensionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SuspensionHistoryRepository extends JpaRepository<SuspensionHistory, Long> {
    List<SuspensionHistory> findByUserNoOrderBySusNoDesc(Long userNo);
}
