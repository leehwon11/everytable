package com.everytable.api.review.service;

import com.everytable.api.member.entity.Member;
import com.everytable.api.member.repository.MemberRepository;
import com.everytable.api.reservation.entity.Reservation;
import com.everytable.api.reservation.repository.ReservationRepository;
import com.everytable.api.review.entity.Review;
import com.everytable.api.review.repository.ReviewRepository;
import com.everytable.api.review.vo.ReviewVO;
import com.everytable.api.store.entity.Store;
import com.everytable.api.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final ReviewRepository      reviewRepository;
    private final MemberRepository      memberRepository;
    private final StoreRepository       storeRepository;
    private final ReservationRepository reservationRepository;

    @Override
    public List<ReviewVO> list(Long storeNo) {
        return toVOList(reviewRepository.findByStoreNo(storeNo));
    }

    @Override
    public List<ReviewVO> myList(String userId) {
        Long userNo = memberRepository.findByLoginId(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 회원입니다."))
                .getNo();
        return toVOList(reviewRepository.findByUserNo(userNo));
    }

    @Override
    public List<ReviewVO> adminList(Long storeNo) {
        return list(storeNo);
    }

    @Override
    public ReviewVO view(Long no) {
        Review r = reviewRepository.findById(no)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 리뷰입니다."));
        return toVO(r);
    }

    @Override
    @Transactional
    public ReviewVO write(ReviewVO vo) {
        Long userNo = vo.getUserNo();

        Reservation reservation = reservationRepository.findById(vo.getResNo())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 예약입니다."));
        if (!reservation.getUserNo().equals(userNo)) {
            throw new RuntimeException("본인 예약에만 리뷰를 작성할 수 있습니다.");
        }
        if (reservation.getResStatus() != 3L) {
            throw new RuntimeException("이용 완료된 예약만 리뷰를 작성할 수 있습니다.");
        }
        if (reservation.getResDate().isAfter(java.time.LocalDate.now())) {
            throw new RuntimeException("예약일이 지난 후에만 리뷰를 작성할 수 있습니다.");
        }
        if (reviewRepository.existsByResNo(vo.getResNo())) {
            throw new RuntimeException("이미 이 예약에 대한 리뷰를 작성하셨습니다.");
        }

        Review review = Review.builder()
                .content(vo.getContent())
                .resNo(reservation.getResNo())
                .rating(vo.getRating())
                .build();
        ReviewVO result = toVO(reviewRepository.save(review));

        // 매장 별점 평균 + 리뷰 수 갱신
        updateStoreRating(reservation.getStoreNo());

        return result;
    }

    @Override
    @Transactional
    public int update(Long no, String content, Integer rating) {
        Review r = reviewRepository.findById(no)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 리뷰입니다."));
        r.setContent(content);
        r.setRating(rating);
        reviewRepository.save(r);

        // 별점이 바뀌었으므로 매장 평균 갱신
        reservationRepository.findById(r.getResNo())
                .ifPresent(res -> updateStoreRating(res.getStoreNo()));

        return 1;
    }

    @Override
    @Transactional
    public int delete(Long no) {
        Review r = reviewRepository.findById(no)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 리뷰입니다."));

        // 삭제 전에 storeNo 먼저 확보
        Long storeNo = reservationRepository.findById(r.getResNo())
                .map(Reservation::getStoreNo).orElse(null);

        reviewRepository.deleteById(no);

        // 삭제 후 매장 평균 갱신
        if (storeNo != null) updateStoreRating(storeNo);

        return 1;
    }

    /**
     * 리뷰 작성/수정/삭제 후 store.avgRating, store.reviewCount 갱신.
     * 소수점 둘째 자리에서 반올림 (원본 avg_rating DECIMAL(3,2)와 동일).
     */
    private void updateStoreRating(Long storeNo) {
        Store store = storeRepository.findById(storeNo).orElse(null);
        if (store == null) return;

        Double avg = reviewRepository.avgRatingByStoreNo(storeNo);
        Long   count = reviewRepository.countByStoreNo(storeNo);

        // 소수점 둘째 자리 반올림
        double rounded = Math.round((avg == null ? 0.0 : avg) * 100.0) / 100.0;
        store.setAvgRating(rounded);
        store.setReviewCount(count == null ? 0 : count.intValue());
        storeRepository.save(store);
    }

    private List<ReviewVO> toVOList(List<Review> reviews) {
        if (reviews.isEmpty()) return new ArrayList<>();

        // 리뷰가 달린 예약/회원/매장 정보를 각각 한 번씩만 조회해서 N+1을 방지한다.
        List<Long> resNos = reviews.stream().map(Review::getResNo).distinct().toList();
        Map<Long, Reservation> reservationMap = new HashMap<>();
        for (Reservation res : reservationRepository.findAllById(resNos)) {
            reservationMap.put(res.getResNo(), res);
        }

        List<Long> userNos = reservationMap.values().stream().map(Reservation::getUserNo).distinct().toList();
        Map<Long, String> userNameMap = new HashMap<>();
        for (Member m : memberRepository.findAllById(userNos)) {
            userNameMap.put(m.getNo(), m.getName());
        }

        List<Long> storeNos = reservationMap.values().stream().map(Reservation::getStoreNo).distinct().toList();
        Map<Long, String> storeNameMap = new HashMap<>();
        for (Store s : storeRepository.findAllById(storeNos)) {
            storeNameMap.put(s.getStoreNo(), s.getStoreName());
        }

        List<ReviewVO> list = new ArrayList<>();
        for (Review r : reviews) {
            ReviewVO vo = new ReviewVO();
            vo.setReviewNo(r.getReviewNo());
            vo.setContent(r.getContent());
            vo.setResNo(r.getResNo());
            vo.setRating(r.getRating());
            vo.setCreatedAt(r.getCreatedAt() == null ? null : r.getCreatedAt().format(DATE_FMT));

            Reservation reservation = reservationMap.get(r.getResNo());
            if (reservation != null) {
                vo.setUserNo(reservation.getUserNo());
                vo.setStoreNo(reservation.getStoreNo());
                vo.setUserName(userNameMap.get(reservation.getUserNo()));
                vo.setStoreName(storeNameMap.get(reservation.getStoreNo()));
            }
            list.add(vo);
        }
        return list;
    }

    private ReviewVO toVO(Review r) {
        ReviewVO vo = new ReviewVO();
        vo.setReviewNo(r.getReviewNo());
        vo.setContent(r.getContent());
        vo.setResNo(r.getResNo());
        vo.setRating(r.getRating());
        vo.setCreatedAt(r.getCreatedAt() == null ? null : r.getCreatedAt().format(DATE_FMT));

        reservationRepository.findById(r.getResNo()).ifPresent(reservation -> {
            vo.setUserNo(reservation.getUserNo());
            vo.setStoreNo(reservation.getStoreNo());
            memberRepository.findById(reservation.getUserNo())
                    .ifPresent((Member writer) -> vo.setUserName(writer.getName()));
            Store store = storeRepository.findById(reservation.getStoreNo()).orElse(null);
            if (store != null) vo.setStoreName(store.getStoreName());
        });

        return vo;
    }
}