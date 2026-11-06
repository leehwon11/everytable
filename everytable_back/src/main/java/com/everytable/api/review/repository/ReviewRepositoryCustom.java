package com.everytable.api.review.repository;

import com.everytable.api.review.entity.Review;

import java.util.List;

// review 테이블에서 user_no/store_no 컬럼을 없애고 res_no(예약 FK)만 남겨서,
// 매장별/회원별 리뷰 목록은 reservation을 조인해서 조회해야 한다 (ReviewRepositoryCustomImpl 참고).
public interface ReviewRepositoryCustom {
    List<Review> findByStoreNo(Long storeNo);
    List<Review> findByUserNo(Long userNo);
}
