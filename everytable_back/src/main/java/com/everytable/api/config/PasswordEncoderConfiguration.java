package com.everytable.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// 원본 everytable은 jbcrypt(BCrypt.hashpw/checkpw)를 직접 사용했다.
// Spring Security의 BCryptPasswordEncoder도 동일한 BCrypt 알고리즘이라 동작이 동일하다.
@Configuration
public class PasswordEncoderConfiguration {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
