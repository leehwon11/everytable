package com.everytable.api.member.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 원본 everytable.member.vo.MemberVO 이식 (회원가입/내정보/관리자 상세조회 등에 공용으로 사용)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberVO {

    private Long no;
    private String id;
    private String pw;
    private String newPw;
    private String name;
    private String gender;
    private String birth;          // yyyy-MM-dd
    private String tel;
    private String email;
    private String status;
    private Integer gradeNo;
    private String gradeName;
    private String joinDate;       // yyyy-MM-dd
    private String lastLogin;      // yyyy-MM-dd
    private String suspensionEndDate; // yyyy-MM-dd
    private String withdrawDate;   // yyyy-MM-dd

    // 매장점주인 경우 매장 요약 정보 (관리자 목록/상세용, store 도메인과 조인)
    private String storeName;
}
