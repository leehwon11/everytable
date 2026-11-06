package com.everytable.api.member.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// SignInResultDto가 상속해서 builder()로 success/code/msg까지 함께 채울 수 있도록
// @Builder 대신 상속을 지원하는 @SuperBuilder를 사용한다.
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SignUpResultVO {
    private boolean success;
    private int code;
    private String msg;
}
