package com.pickpl.app.security.oauth2;

import com.pickpl.app.domain.user.Role;
import com.pickpl.app.domain.user.User;
import com.pickpl.app.security.jwt.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        User user = oAuth2User.getUser();

        String accessToken = jwtTokenProvider.createToken(String.valueOf(user.getId()), user.getRole().name());
        String refreshToken = jwtTokenProvider.createRefreshToken();

        // Refresh Token Redis 저장
        redisTemplate.opsForValue().set(
                "RT:" + user.getId(),
                refreshToken,
                14,
                java.util.concurrent.TimeUnit.DAYS
        );

        String targetUrl;

        // 권한이 GUEST인 경우 (최초 가입자) -> 추가 정보 입력 페이지로 리다이렉트
        if (user.getRole() == Role.GUEST) {
            targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/oauth-signup")
                    .queryParam("accessToken", accessToken)
                    .queryParam("refreshToken", refreshToken)
                    .build().toUriString();
        } else {
            // 이미 가입된 유저 (USER 권한) -> 메인 혹은 로그인 성공 페이지로 리다이렉트
            targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/auth-success")
                    .queryParam("accessToken", accessToken)
                    .queryParam("refreshToken", refreshToken)
                    .queryParam("nickname", user.getNickname())
                    .encode(java.nio.charset.StandardCharsets.UTF_8)
                    .build().toUriString();
        }

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
