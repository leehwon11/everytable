package com.everytable.api.reservation.repository;

import com.everytable.api.reservation.entity.QReservation;
import com.everytable.api.reservation.entity.Reservation;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class ReservationRepositoryCustomImpl implements ReservationRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final QReservation r = QReservation.reservation;

    private BooleanBuilder statusFilter(String key) {
        BooleanBuilder builder = new BooleanBuilder();
        if (key != null && !key.trim().isEmpty() && !key.trim().equals("0")) {
            try {
                builder.and(r.resStatus.eq(Long.parseLong(key.trim())));
            } catch (NumberFormatException ignore) {}
        }
        return builder;
    }

    @Override
    public List<Reservation> searchByUser(Long userNo, String key, long offset, long limit) {
        return queryFactory
                .selectFrom(r)
                .where(r.userNo.eq(userNo), statusFilter(key))
                .orderBy(r.resCreatedAt.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long searchByUserCount(Long userNo, String key) {
        Long count = queryFactory
                .select(r.count())
                .from(r)
                .where(r.userNo.eq(userNo), statusFilter(key))
                .fetchOne();
        return count == null ? 0L : count;
    }

    @Override
    public List<Reservation> searchByStore(Long storeNo, String key, long offset, long limit) {
        return queryFactory
                .selectFrom(r)
                .where(r.storeNo.eq(storeNo), statusFilter(key))
                .orderBy(r.resCreatedAt.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long searchByStoreCount(Long storeNo, String key) {
        Long count = queryFactory
                .select(r.count())
                .from(r)
                .where(r.storeNo.eq(storeNo), statusFilter(key))
                .fetchOne();
        return count == null ? 0L : count;
    }

    @Override
    public List<Reservation> searchByStoreIn(List<Long> storeNos, String key, long offset, long limit) {
        return queryFactory
                .selectFrom(r)
                .where(r.storeNo.in(storeNos), statusFilter(key))
                .orderBy(r.resCreatedAt.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long searchByStoreInCount(List<Long> storeNos, String key) {
        Long count = queryFactory
                .select(r.count())
                .from(r)
                .where(r.storeNo.in(storeNos), statusFilter(key))
                .fetchOne();
        return count == null ? 0L : count;
    }

    @Override
    public List<Reservation> searchAll(String key, long offset, long limit) {
        return queryFactory
                .selectFrom(r)
                .where(statusFilter(key))
                .orderBy(r.resCreatedAt.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long searchAllCount(String key) {
        Long count = queryFactory
                .select(r.count())
                .from(r)
                .where(statusFilter(key))
                .fetchOne();
        return count == null ? 0L : count;
    }

    @Override
    public List<Long> topStoreNosByOrderCount(LocalDateTime from, LocalDateTime to, long limit) {
        return queryFactory
                .select(r.storeNo)
                .from(r)
                .where(
                        r.resCreatedAt.goe(from),
                        r.resCreatedAt.lt(to),
                        r.resStatus.in(2L, 3L)
                )
                .groupBy(r.storeNo)
                .orderBy(r.storeNo.count().desc())
                .limit(limit)
                .fetch();
    }
}
