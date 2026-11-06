package com.everytable.api.payment.repository;

import com.everytable.api.member.entity.QMember;
import com.everytable.api.payment.entity.Payment;
import com.everytable.api.payment.entity.QPayment;
import com.everytable.api.payment.vo.DailyPaymentStatVO;
import com.everytable.api.reservation.entity.QReservation;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.DateTemplate;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// 팀 최종 스키마 반영: payment 테이블에서 user_id/store_id 컬럼이 사라져서, 사용자/매장 조건은
// payment.res_no = reservation.res_no, reservation.user_no = member.member_no 로 조인해서 구한다.
@Repository
@RequiredArgsConstructor
public class PaymentRepositoryCustomImpl implements PaymentRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    QPayment payment = QPayment.payment;
    QReservation reservation = QReservation.reservation;
    QMember member = QMember.member;

    // 원본: key에 포함된 문자(m/s/u)에 따라 각각의 like 조건을 OR로 묶는다
    private BooleanBuilder condition(String key, String word) {
        BooleanBuilder builder = new BooleanBuilder();
        if (word == null || word.isEmpty() || key == null) return builder;
        BooleanBuilder or = new BooleanBuilder();
        boolean any = false;
        if (key.contains("m")) { or.or(payment.method.contains(word)); any = true; }
        if (key.contains("s")) { or.or(payment.status.contains(word)); any = true; }
        if (key.contains("u")) { or.or(member.loginId.contains(word)); any = true; }
        if (any) builder.and(or);
        return builder;
    }

    @Override
    public List<Payment> search(String key, String word, String enforcedUserId, long offset, long limit) {
        BooleanBuilder where = condition(key, word);
        if (enforcedUserId != null) where.and(member.loginId.eq(enforcedUserId));
        return queryFactory
                .select(payment)
                .from(payment)
                .join(reservation).on(payment.resNo.eq(reservation.resNo))
                .join(member).on(reservation.userNo.eq(member.no))
                .where(where)
                .orderBy(payment.paymentNo.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long searchCount(String key, String word, String enforcedUserId) {
        BooleanBuilder where = condition(key, word);
        if (enforcedUserId != null) where.and(member.loginId.eq(enforcedUserId));
        Long count = queryFactory
                .select(payment.count())
                .from(payment)
                .join(reservation).on(payment.resNo.eq(reservation.resNo))
                .join(member).on(reservation.userNo.eq(member.no))
                .where(where)
                .fetchOne();
        return count == null ? 0 : count;
    }

    // storeNos가 null이면 매장 조건 없이 전체 대상 (관리자용).
    private BooleanBuilder storeCondition(List<Long> storeNos) {
        BooleanBuilder builder = new BooleanBuilder();
        if (storeNos != null) builder.and(reservation.storeNo.in(storeNos));
        return builder;
    }

    @Override
    public Long todaySalesSum(List<Long> storeNos, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        Long sum = queryFactory
                .select(payment.amount.sum())
                .from(payment)
                .join(reservation).on(payment.resNo.eq(reservation.resNo))
                .where(storeCondition(storeNos)
                        .and(payment.status.eq("SUCCESS"))
                        .and(payment.payDate.goe(start))
                        .and(payment.payDate.lt(end)))
                .fetchOne();
        return sum == null ? 0L : sum;
    }

    @Override
    public Long todayOrderCount(List<Long> storeNos, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        Long count = queryFactory
                .select(payment.count())
                .from(payment)
                .join(reservation).on(payment.resNo.eq(reservation.resNo))
                .where(storeCondition(storeNos)
                        .and(payment.status.eq("SUCCESS"))
                        .and(payment.payDate.goe(start))
                        .and(payment.payDate.lt(end)))
                .fetchOne();
        return count == null ? 0L : count;
    }

    // payDate(datetime)를 날짜 단위로 잘라서 그룹핑하기 위한 표현식 (MariaDB DATE() 함수).
    // JDBC 드라이버가 DATE()의 결과를 java.sql.Date로 내려주기 때문에 LocalDate로 바로 캐스팅하면
    // ClassCastException이 난다 - java.sql.Date로 받은 뒤 toLocalDate()로 직접 변환해야 한다.
    private DateTemplate<java.sql.Date> payDateOnly() {
        return Expressions.dateTemplate(java.sql.Date.class, "DATE({0})", payment.payDate);
    }

    private BooleanBuilder rangeCondition(List<Long> storeNos, LocalDate startDate, LocalDate endDate) {
        BooleanBuilder where = storeCondition(storeNos).and(payment.status.eq("SUCCESS"));
        if (startDate != null) where.and(payment.payDate.goe(startDate.atStartOfDay()));
        if (endDate != null) where.and(payment.payDate.lt(endDate.plusDays(1).atStartOfDay()));
        return where;
    }

    @Override
    public List<DailyPaymentStatVO> aggregateDaily(List<Long> storeNos, LocalDate startDate, LocalDate endDate, long offset, long limit) {
        DateTemplate<java.sql.Date> dateExpr = payDateOnly();
        List<Tuple> rows = queryFactory
                .select(dateExpr, payment.count(), payment.amount.sum())
                .from(payment)
                .join(reservation).on(payment.resNo.eq(reservation.resNo))
                .where(rangeCondition(storeNos, startDate, endDate))
                .groupBy(dateExpr)
                .orderBy(dateExpr.desc())
                .offset(offset)
                .limit(limit)
                .fetch();

        List<DailyPaymentStatVO> result = new ArrayList<>();
        for (Tuple t : rows) {
            java.sql.Date d = t.get(dateExpr);
            result.add(new DailyPaymentStatVO(
                    d == null ? null : d.toLocalDate(),
                    t.get(payment.count()),
                    t.get(payment.amount.sum())
            ));
        }
        return result;
    }

    @Override
    public long aggregateDailyGroupCount(List<Long> storeNos, LocalDate startDate, LocalDate endDate) {
        DateTemplate<java.sql.Date> dateExpr = payDateOnly();
        List<java.sql.Date> dates = queryFactory
                .select(dateExpr)
                .from(payment)
                .join(reservation).on(payment.resNo.eq(reservation.resNo))
                .where(rangeCondition(storeNos, startDate, endDate))
                .groupBy(dateExpr)
                .fetch();
        return dates.size();
    }

    @Override
    public Long sumAmountInRange(List<Long> storeNos, LocalDate startDate, LocalDate endDate) {
        Long sum = queryFactory
                .select(payment.amount.sum())
                .from(payment)
                .join(reservation).on(payment.resNo.eq(reservation.resNo))
                .where(rangeCondition(storeNos, startDate, endDate))
                .fetchOne();
        return sum == null ? 0L : sum;
    }
}