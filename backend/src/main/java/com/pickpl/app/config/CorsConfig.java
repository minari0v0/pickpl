package com.pickpl.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 전역 CORS 설정.
 * 프론트엔드(localhost:3000) → 백엔드(localhost:8080) 요청을 허용합니다.
 *
 * 운영 배포 시에는 allowedOrigins를 실제 도메인으로 교체해야 합니다.
 */
@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(
                                "http://localhost:3000",  // Next.js 개발 서버
                                "http://localhost:3001"   // 포트 충돌 시 대비
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600); // preflight 캐시 1시간
            }
        };
    }
}
