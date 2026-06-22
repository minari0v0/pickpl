package com.pickpl.app.security.oauth2;

import com.pickpl.app.domain.user.Role;
import com.pickpl.app.domain.user.User;
import com.pickpl.app.domain.user.UserRepository;
import com.pickpl.app.domain.user.UserSession;
import com.pickpl.app.domain.user.UserSessionRepository;
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
    private final UserSessionRepository userSessionRepository;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        User user = oAuth2User.getUser();

        // 1. 수동 계정 연동 성공 시 리다이렉트 분기 처리
        jakarta.servlet.http.HttpSession session = request.getSession(false);
        if (session != null && "true".equals(session.getAttribute("link_success"))) {
            String provider = (String) session.getAttribute("link_provider");
            session.removeAttribute("link_success");
            session.removeAttribute("link_provider");

            String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/")
                    .queryParam("linkSuccess", "true")
                    .queryParam("provider", provider)
                    .build().toUriString();
            
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
            return;
        }

        // 2. 소셜 로그인 처리 플로우
        String accessToken = jwtTokenProvider.createToken(String.valueOf(user.getId()), user.getRole().name());
        String refreshToken = jwtTokenProvider.createRefreshToken();

        // Refresh Token Redis 저장 (다중 세션 지원)
        redisTemplate.opsForValue().set(
                "RT:" + user.getId() + ":" + refreshToken,
                refreshToken,
                14,
                java.util.concurrent.TimeUnit.DAYS
        );

        // 로그인 기기 세션 기록
        recordUserSession(request, user, refreshToken);

        String targetUrl;

        if (user.getRole() == Role.GUEST) {
            targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/oauth-signup")
                    .queryParam("accessToken", accessToken)
                    .queryParam("refreshToken", refreshToken)
                    .build().toUriString();
        } else {
            targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/auth-success")
                    .queryParam("accessToken", accessToken)
                    .queryParam("refreshToken", refreshToken)
                    .queryParam("nickname", user.getNickname())
                    .encode(java.nio.charset.StandardCharsets.UTF_8)
                    .build().toUriString();
        }

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private void recordUserSession(HttpServletRequest request, User user, String refreshToken) {
        try {
            String ip = getClientIp(request);
            String userAgent = request.getHeader("User-Agent");
            
            User persistentUser = userRepository.getReferenceById(user.getId());
            
            UserSession userSession = UserSession.builder()
                    .user(persistentUser)
                    .refreshTokenUuid(refreshToken)
                    .ipAddress(ip)
                    .location(getIpLocation(ip))
                    .device(parseDevice(userAgent))
                    .browser(parseBrowser(userAgent))
                    .lastAccessedAt(java.time.LocalDateTime.now())
                    .build();
            
            userSessionRepository.save(userSession);
        } catch (Exception e) {
            System.err.println("소셜 로그인 세션 기록 중 예외 발생: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    private String parseDevice(String userAgent) {
        if (userAgent == null) return "Unknown OS";
        String ua = userAgent.toLowerCase();
        if (ua.contains("windows")) return "Windows";
        if (ua.contains("macintosh") || ua.contains("mac os x")) return "macOS";
        if (ua.contains("iphone") || ua.contains("ipad")) return "iOS";
        if (ua.contains("android")) return "Android";
        if (ua.contains("linux")) return "Linux";
        return "Unknown OS";
    }

    private String parseBrowser(String userAgent) {
        if (userAgent == null) return "Unknown Browser";
        String ua = userAgent.toLowerCase();
        if (ua.contains("chrome")) return "Chrome";
        if (ua.contains("safari") && !ua.contains("chrome")) return "Safari";
        if (ua.contains("firefox")) return "Firefox";
        if (ua.contains("edge")) return "Edge";
        return "Browser";
    }

    private String getIpLocation(String ip) {
        return "Seoul";
    }
}
