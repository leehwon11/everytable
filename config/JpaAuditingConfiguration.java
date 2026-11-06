package com.everytable.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

// @CreatedDate / @LastModifiedDate 자동 세팅을 위한 설정
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfiguration {
}
