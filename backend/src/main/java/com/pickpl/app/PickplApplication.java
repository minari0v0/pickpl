package com.pickpl.app;

import com.pickpl.app.domain.user.SocialConnectionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * PickPl 3.0 백엔드 애플리케이션 진입점.
 *
 * @EnableJpaAuditing : BaseTimeEntity의 @CreatedDate / @LastModifiedDate
 *                      자동 주입을 활성화합니다.
 */
@EnableJpaAuditing
@SpringBootApplication
public class PickplApplication {

	public static void main(String[] args) {
		SpringApplication.run(PickplApplication.class, args);
	}

	@Bean
	public CommandLineRunner cleanWrongSocialConnection(SocialConnectionRepository repository) {
		return args -> {
			try {
				repository.findAll().forEach(conn -> {
					if ("NAVER".equalsIgnoreCase(conn.getProvider())) {
						repository.delete(conn);
						System.out.println("==================================================");
						System.out.println("임시 클리닝: NAVER 연동 정보(" + conn.getProviderId() + ")를 정상 제거했습니다.");
						System.out.println("==================================================");
					}
				});
			} catch (Exception e) {
				System.err.println("클리닝 에러: " + e.getMessage());
				e.printStackTrace();
			}
		};
	}
}
