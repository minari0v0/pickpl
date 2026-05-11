package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * PickPl 3.0 백엔드 애플리케이션 진입점.
 *
 * @EnableJpaAuditing : BaseTimeEntity의 @CreatedDate / @LastModifiedDate
 *                      자동 주입을 활성화합니다.
 */
@EnableJpaAuditing
@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

}
