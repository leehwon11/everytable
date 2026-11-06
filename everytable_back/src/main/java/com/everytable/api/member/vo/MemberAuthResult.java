package com.everytable.api.member.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 아이디/비밀번호 검증까지만 마친 상태를 표현하는 내부 DTO.
// status가 "휴면"이면 컨트롤러가 바로 토큰을 발급하지 않고 이메일 인증 절차로 분기한다(원본 로직과 동일).
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberAuthResult {
    private String id;
    private String name;
    private Integer gradeNo;
    private String gradeName;
    private String status;
    private String email;
}
