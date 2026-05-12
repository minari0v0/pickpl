package com.pickpl.app.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger(springdoc-openapi) 설정 클래스.
 * 접속 URL: http://localhost:8080/swagger-ui.html
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI pickplOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("PickPl API")
                        .description("감성 공간 큐레이션 서비스 PickPl 백엔드 API 명세서")
                        .version("v0.1.0")
                        .contact(new Contact()
                                .name("PickPl Dev Team")
                                .email("dev@pickpl.com")));
    }
}
