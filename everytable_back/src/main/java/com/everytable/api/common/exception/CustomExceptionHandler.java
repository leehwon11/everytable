package com.everytable.api.common.exception;

import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

// 모든 컨트롤러에서 발생하는 RuntimeException 을 공통으로 처리해서
// 프론트(React)에서 일관된 형태의 오류 메시지를 받을 수 있도록 한다.
@RestControllerAdvice
@Log4j2
public class CustomExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException e) {
        log.error("[handleRuntimeException] message = {}", e.getMessage());
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
