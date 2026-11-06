package com.everytable.api.common;

import lombok.Getter;

// 공통 응답 코드 - 회원가입/로그인 등 결과의 code, msg를 통일하기 위한 enum
@Getter
public enum CommonResponse {

    SUCCESS(0, "성공"),
    FAIL(-1, "실패");

    private final int code;
    private final String msg;

    CommonResponse(int code, String msg) {
        this.code = code;
        this.msg = msg;
    }
}
