package com.everytable.api.notice.repository;

import com.everytable.api.notice.entity.Notice;

import java.util.List;
import java.util.Optional;

// 원본 NoticeDAO.list()/getTotalRow()/view()/increase() 를 QueryDSL로 재구현
public interface NoticeRepositoryCustom {

    // key: 카테고리 번호 문자열("1"~"4"), null/""/"0" 이면 전체
    List<Notice> search(String key, long offset, long limit);

    long searchCount(String key);

    Optional<Notice> findByIdWithLock(Long no);

    long increaseHit(Long no);
}
