package com.everytable.api.review.repository;

import com.everytable.api.reservation.entity.QReservation;
import com.everytable.api.review.entity.QReview;
import com.everytable.api.review.entity.Review;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

// review.store_no/user_no 컬럼이 없어져서, reservation을 조인해 res_no를 통해 매장/회원 기준으로 조회한다.
@Repository
@RequiredArgsConstructor
public class ReviewRepositoryCustomImpl implements ReviewRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    QReview review = QReview.review;
    QReservation reservation = QReservation.reservation;

    @Override
    public List<Review> findByStoreNo(Long storeNo) {
        return queryFactory
                .selectFrom(review)
                .join(reservation).on(review.resNo.eq(reservation.resNo))
                .where(reservation.storeNo.eq(storeNo))
                .orderBy(review.reviewNo.desc())
                .fetch();
    }

    @Override
    public List<Review> findByUserNo(Long userNo) {
        return queryFactory
                .selectFrom(review)
                .join(reservation).on(review.resNo.eq(reservation.resNo))
                .where(reservation.userNo.eq(userNo))
                .orderBy(review.reviewNo.desc())
                .fetch();
    }
}
