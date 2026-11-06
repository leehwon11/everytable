package com.everytable.api.notice.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.everytable.api.notice.entity.Notice;
import com.everytable.api.notice.entity.QNotice;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// 원본 NoticeDAO.list()/getTotalRow()/category() 를 QueryDSL로 재구현
@Repository
@RequiredArgsConstructor
public class NoticeRepositoryCustomImpl implements NoticeRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    QNotice notice = QNotice.notice;

    private com.querydsl.core.BooleanBuilder categoryCondition(String key) {
        com.querydsl.core.BooleanBuilder builder = new com.querydsl.core.BooleanBuilder();
        if (key != null && !key.trim().isEmpty() && !key.trim().equals("0")) {
            try {
                builder.and(notice.cateNo.eq(Integer.parseInt(key.trim())));
            } catch (NumberFormatException ignore) {
                // 잘못된 key는 원본처럼 조건 없이(전체) 처리
            }
        }
        return builder;
    }

    @Override
    public List<Notice> search(String key, long offset, long limit) {
        return queryFactory
                .selectFrom(notice)
                .where(categoryCondition(key))
                .orderBy(notice.noticeNo.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long searchCount(String key) {
        Long count = queryFactory
                .select(notice.count())
                .from(notice)
                .where(categoryCondition(key))
                .fetchOne();
        return count == null ? 0 : count;
    }

    @Override
    public Optional<Notice> findByIdWithLock(Long no) {
        return Optional.ofNullable(
                queryFactory.selectFrom(notice).where(notice.noticeNo.eq(no)).fetchOne());
    }

    @Override
    public long increaseHit(Long no) {
        return queryFactory
                .update(notice)
                .set(notice.hit, notice.hit.add(1))
                .where(notice.noticeNo.eq(no))
                .execute();
    }
}
