package com.everytable.api.review.repository;

import com.everytable.api.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long>, ReviewRepositoryCustom {

    boolean existsByResNo(Long resNo);
    Optional<Review> findByResNo(Long resNo);

    /** 특정 매장의 삭제되지 않은 리뷰 평균 rating */
    @Query(value = """
        SELECT COALESCE(AVG(r.rating), 0)
        FROM review r
        JOIN reservation res ON r.res_no = res.res_no
        WHERE res.store_no = :storeNo
    """, nativeQuery = true)
    Double avgRatingByStoreNo(@Param("storeNo") Long storeNo);

    @Query(value = """
        SELECT COUNT(r.review_no)
        FROM review r
        JOIN reservation res ON r.res_no = res.res_no
        WHERE res.store_no = :storeNo
    """, nativeQuery = true)
    Long countByStoreNo(@Param("storeNo") Long storeNo);

    Optional<Review> findFirstByResNoOrderByReviewNoDesc(Long resNo);
}