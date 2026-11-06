package com.everytable.api.member.repository;

import com.everytable.api.member.entity.Member;

import java.util.List;

// 원본 MemberDAO.list()/getTotalRow() (검색+페이징) 을 QueryDSL로 재구현하기 위한 커스텀 리포지토리
public interface MemberRepositoryCustom {

    List<Member> search(String keyword, String status, Integer gradeNo,
                         String dateFrom, String dateTo, long offset, long limit);

    long searchCount(String keyword, String status, Integer gradeNo,
                      String dateFrom, String dateTo);
}
