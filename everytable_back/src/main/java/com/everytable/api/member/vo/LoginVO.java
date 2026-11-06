package com.everytable.api.member.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 원본 everytable.member.vo.LoginVO 이식 - 로그인 요청/응답에 사용
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginVO {
    private String id;
    private String pw;
    private String name;
    private Integer gradeNo;
    private String gradeName;
    private String status;
}
