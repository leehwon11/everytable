package com.everytable.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // FileStorageService와 동일한 값을 사용해야 한다 (application.properties의 app.upload.dir).
    @Value("${app.upload.dir:C:/Temp/upload}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 공지/메뉴/매장 이미지를 로컬 폴더에 저장하고 URI(/upload/**)로 접근할 수 있도록 매핑
        registry.addResourceHandler("/upload/**")
                .addResourceLocations("file:///" + uploadDir.replace("\\", "/") + "/");
    }
}
