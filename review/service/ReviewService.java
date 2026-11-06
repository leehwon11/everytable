package com.everytable.api.review.service;

import com.everytable.api.review.vo.ReviewVO;

import java.util.List;

public interface ReviewService {

    List<ReviewVO> list(Long storeNo);

    List<ReviewVO> myList(String userNo);

    List<ReviewVO> adminList(Long storeNo);

    ReviewVO view(Long no);

    ReviewVO write(ReviewVO vo);

    int update(Long no, String content, Integer rating);  // Double -> Integer

    int delete(Long no);
}