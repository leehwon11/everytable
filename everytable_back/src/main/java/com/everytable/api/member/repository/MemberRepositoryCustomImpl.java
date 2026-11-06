package com.everytable.api.member.repository;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.everytable.api.member.entity.Member;
import com.everytable.api.member.entity.QMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

// 원본 MemberDAO.searchCondition()/list()/getTotalRow() 를 QueryDSL로 재구현
// (원본은 문자열을 SQL에 직접 이어붙이는 방식이었으나(SQL Injection 위험), QueryDSL의 파라메터 바인딩으로 안전하게 대체)
@Repository
@RequiredArgsConstructor
public class MemberRepositoryCustomImpl implements MemberRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    QMember member = QMember.member;

    private BooleanBuilder condition(String keyword, String status, Integer gradeNo, String dateFrom, String dateTo) {
        BooleanBuilder builder = new BooleanBuilder();

        // 탈퇴/파기 회원도 관리자 목록에서는 상태 필터로 걸러서 보여준다 (원본과 동일하게 정상/휴면/정지/탈퇴 포함)
        builder.and(member.status.in("정상", "휴면", "정지", "탈퇴"));

        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            builder.and(member.loginId.contains(kw)
                    .or(member.name.contains(kw))
                    .or(member.tel.contains(kw)));
        }
        if (status != null && !status.trim().isEmpty() && !"전체".equals(status)) {
            builder.and(member.status.eq(status.trim()));
        }
        if (gradeNo != null && gradeNo != 0) {
            builder.and(member.gradeNo.eq(gradeNo));
        }
        if (dateFrom != null && !dateFrom.trim().isEmpty()) {
            builder.and(member.joinDate.goe(LocalDate.parse(dateFrom.trim()).atStartOfDay()));
        }
        if (dateTo != null && !dateTo.trim().isEmpty()) {
            builder.and(member.joinDate.lt(LocalDate.parse(dateTo.trim()).plusDays(1).atStartOfDay()));
        }
        return builder;
    }

    @Override
    public List<Member> search(String keyword, String status, Integer gradeNo,
                                String dateFrom, String dateTo, long offset, long limit) {
        return queryFactory
                .selectFrom(member)
                .where(condition(keyword, status, gradeNo, dateFrom, dateTo))
                .orderBy(member.no.desc())
                .offset(offset)
                .limit(limit)
                .fetch();
    }

    @Override
    public long searchCount(String keyword, String status, Integer gradeNo, String dateFrom, String dateTo) {
        Long count = queryFactory
                .select(member.count())
                .from(member)
                .where(condition(keyword, status, gradeNo, dateFrom, dateTo))
                .fetchOne();
        return count == null ? 0 : count;
    }
}
