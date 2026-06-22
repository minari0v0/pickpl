package com.pickpl.app.auth.service;

import com.pickpl.app.auth.dto.AuthResponse;
import com.pickpl.app.auth.dto.LoginRequest;
import com.pickpl.app.auth.dto.SignupRequest;
import com.pickpl.app.domain.user.AuthProvider;
import com.pickpl.app.domain.user.Role;
import com.pickpl.app.domain.user.User;
import com.pickpl.app.domain.user.UserRepository;
import com.pickpl.app.security.jwt.JwtTokenProvider;
import com.pickpl.app.auth.dto.PasswordChangeRequest;
import com.pickpl.app.domain.scrap.ScrapRepository;
import com.pickpl.app.domain.vibe.VibeVoteRepository;
import com.pickpl.app.domain.user.SocialConnection;
import com.pickpl.app.domain.user.SocialConnectionRepository;
import com.pickpl.app.domain.user.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ClassPathResource;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;
    private final ScrapRepository scrapRepository;
    private final VibeVoteRepository vibeVoteRepository;
    private final SocialConnectionRepository socialConnectionRepository;
    private final JavaMailSender mailSender;
    private final UserSessionRepository userSessionRepository;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}")
    private String mailUsername;

    @Transactional
    public Long signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        if (userRepository.existsByNickname(request.nickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .nickname(request.nickname())
                .role(Role.USER)
                .provider(AuthProvider.LOCAL)
                .build();

        return userRepository.save(user).getId();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (user.getProvider() != AuthProvider.LOCAL) {
            throw new IllegalArgumentException("소셜 로그인으로 가입된 계정입니다.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // Access Token & Refresh Token 생성
        String accessToken = jwtTokenProvider.createToken(String.valueOf(user.getId()), user.getRole().name());
        String refreshToken = jwtTokenProvider.createRefreshToken();

        // Refresh Token을 Redis에 저장 (다중 세션: RT:userId:token)
        redisTemplate.opsForValue().set(
                "RT:" + user.getId() + ":" + refreshToken,
                refreshToken,
                14, // 14일
                java.util.concurrent.TimeUnit.DAYS
        );

        // 기기 세션 정보 기록
        recordUserSession(user, refreshToken);

        return AuthResponse.of(accessToken, refreshToken, user.getId(), user.getNickname());
    }

    @Transactional
    public AuthResponse reissue(com.pickpl.app.auth.dto.ReissueRequest request) {
        // 1. Refresh Token 검증
        if (!jwtTokenProvider.validateToken(request.refreshToken())) {
            throw new IllegalArgumentException("Refresh Token이 유효하지 않습니다.");
        }

        // 2. Access Token 에서 User ID 가져오기
        org.springframework.security.core.Authentication authentication = jwtTokenProvider.getAuthentication(request.accessToken());
        String userIdStr = authentication.getName();

        // 3. Redis 에서 다중 기기 토큰 검증
        String redisKey = "RT:" + userIdStr + ":" + request.refreshToken();
        String redisRefreshToken = redisTemplate.opsForValue().get(redisKey);
        if (org.springframework.util.ObjectUtils.isEmpty(redisRefreshToken)) {
            throw new IllegalArgumentException("로그아웃 된 사용자입니다.");
        }

        // 4. 새로운 토큰 생성
        User user = userRepository.findById(Long.valueOf(userIdStr))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        String newAccessToken = jwtTokenProvider.createToken(String.valueOf(user.getId()), user.getRole().name());
        String newRefreshToken = jwtTokenProvider.createRefreshToken();

        // 5. Refresh Token Redis 업데이트
        redisTemplate.delete(redisKey);
        redisTemplate.opsForValue().set(
                "RT:" + user.getId() + ":" + newRefreshToken,
                newRefreshToken,
                14,
                java.util.concurrent.TimeUnit.DAYS
        );

        // 6. DB UserSession 업데이트
        userSessionRepository.findByRefreshTokenUuid(request.refreshToken()).ifPresent(session -> {
            session.updateAccessTime(java.time.LocalDateTime.now(), newRefreshToken);
            userSessionRepository.save(session);
        });

        return AuthResponse.of(newAccessToken, newRefreshToken, user.getId(), user.getNickname());
    }

    @Transactional
    public AuthResponse oauthSignup(String userId, com.pickpl.app.auth.dto.OAuthSignupRequest request) {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        if (user.getRole() != com.pickpl.app.domain.user.Role.GUEST) {
            throw new IllegalArgumentException("이미 가입이 완료된 유저입니다.");
        }

        if (userRepository.existsByNickname(request.nickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        user.updateProfile(request.nickname(), user.getProfileImageUrl());
        user.updateRole(com.pickpl.app.domain.user.Role.USER);

        String newAccessToken = jwtTokenProvider.createToken(String.valueOf(user.getId()), user.getRole().name());
        String newRefreshToken = jwtTokenProvider.createRefreshToken();

        redisTemplate.opsForValue().set(
                "RT:" + user.getId(),
                newRefreshToken,
                14,
                java.util.concurrent.TimeUnit.DAYS
        );

        return AuthResponse.of(newAccessToken, newRefreshToken, user.getId(), user.getNickname());
    }

    @Transactional(readOnly = true)
    public boolean checkNickname(String nickname) {
        return !userRepository.existsByNickname(nickname); // true면 사용 가능(중복 아님)
    }

    @Transactional
    public void logout(String userId) {
        List<com.pickpl.app.domain.user.UserSession> sessions = userSessionRepository.findByUserId(Long.valueOf(userId));
        for (com.pickpl.app.domain.user.UserSession session : sessions) {
            redisTemplate.delete("RT:" + userId + ":" + session.getRefreshTokenUuid());
        }
        userSessionRepository.deleteByUserId(Long.valueOf(userId));
    }

    @Transactional(readOnly = true)
    public com.pickpl.app.auth.dto.UserResponse getProfile(String userId) {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        List<String> linkedProviders = socialConnectionRepository.findByUserId(user.getId())
                .stream()
                .map(SocialConnection::getProvider)
                .toList();

        return com.pickpl.app.auth.dto.UserResponse.of(user, linkedProviders);
    }

    @Transactional
    public com.pickpl.app.auth.dto.UserResponse updateProfile(String userId, com.pickpl.app.auth.dto.UpdateProfileRequest request) {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        if (request.nickname() != null && !request.nickname().isBlank() && !request.nickname().equals(user.getNickname())) {
            if (userRepository.existsByNickname(request.nickname())) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
        }

        user.updateProfile(request.nickname(), request.profileImageUrl());

        List<String> linkedProviders = socialConnectionRepository.findByUserId(user.getId())
                .stream()
                .map(SocialConnection::getProvider)
                .toList();

        return com.pickpl.app.auth.dto.UserResponse.of(user, linkedProviders);
    }

    @Transactional
    public void changePassword(String userId, PasswordChangeRequest request) {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        if (user.getProvider() != AuthProvider.LOCAL) {
            throw new IllegalArgumentException("소셜 로그인 회원은 비밀번호를 변경할 수 없습니다.");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        user.changePassword(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public void withdraw(String userId) {
        Long userLongId = Long.valueOf(userId);
        User user = userRepository.findById(userLongId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        // 1. 연관 데이터 삭제
        scrapRepository.deleteByUserId(userLongId);
        vibeVoteRepository.deleteByUserId(userLongId);
        socialConnectionRepository.deleteByUserId(userLongId);

        List<com.pickpl.app.domain.user.UserSession> sessions = userSessionRepository.findByUserId(userLongId);
        for (com.pickpl.app.domain.user.UserSession session : sessions) {
            redisTemplate.delete("RT:" + userId + ":" + session.getRefreshTokenUuid());
        }
        userSessionRepository.deleteByUserId(userLongId);

        // 2. 유저 삭제
        userRepository.delete(user);
    }

    @Transactional
    public void sendVerificationEmail(String email) {
        // 6자리 랜덤 인증 코드 생성
        String authCode = String.format("%06d", new java.util.Random().nextInt(1000000));

        // Redis에 5분 유효시간으로 저장
        redisTemplate.opsForValue().set(
                "EmailAuth:" + email,
                authCode,
                5,
                java.util.concurrent.TimeUnit.MINUTES
        );

        // 로컬 테스트 개발을 위해 스프링 콘솔 로그 출력
        System.out.println("\n========================================");
        System.out.println("[Email Verify Code] " + email + " -> " + authCode);
        System.out.println("========================================\n");

        // 실제 SMTP 발송 시도
        if (mailUsername == null || mailUsername.isBlank() || mailUsername.trim().equals(":")) {
            System.out.println("[SMTP Skip] spring.mail.username이 설정되지 않아 이메일 전송을 스킵하고 콘솔 로그로 대체합니다.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(mailUsername);
            helper.setTo(email);
            helper.setSubject("[PickPl] 이메일 본인 인증 코드입니다.");
            
            // HTML 본문 작성
            String htmlContent = "<!DOCTYPE html>\n" +
                    "<html>\n" +
                    "<head>\n" +
                    "    <meta charset=\"utf-8\">\n" +
                    "</head>\n" +
                    "<body style=\"margin: 0; padding: 0; background-color: #FAF6F4; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;\">\n" +
                    "    <div style=\"max-width: 600px; margin: 0 auto; padding: 40px 20px;\">\n" +
                    "        <!-- 상단 로고 영역 -->\n" +
                    "        <div style=\"background-color: #FFF0EB; padding: 24px; text-align: center; border-radius: 24px 24px 0 0; border: 1px solid #FFE3DA; border-bottom: none;\">\n" +
                    "            <img src=\"cid:logo\" alt=\"PickPl Logo\" style=\"height: 80px; object-fit: contain;\" />\n" +
                    "        </div>\n" +
                    "        \n" +
                    "        <!-- 본문 카드 영역 -->\n" +
                    "        <div style=\"background-color: #ffffff; padding: 48px 40px; border-radius: 0 0 24px 24px; border: 1px solid #FFE3DA; border-top: none; box-shadow: 0 10px 30px rgba(255, 95, 46, 0.03);\">\n" +
                    "            <div style=\"text-align: center; margin-bottom: 32px;\">\n" +
                    "                <span style=\"font-size: 28px;\">🍊</span>\n" +
                    "                <h1 style=\"font-size: 22px; font-weight: 800; color: #191F28; margin: 16px 0 8px 0; letter-spacing: -0.5px;\">당신만의 특별한 공간을 찾아서</h1>\n" +
                    "                <p style=\"font-size: 14px; font-weight: 500; color: #8B95A1; margin: 0; line-height: 1.6;\">\n" +
                    "                    안녕하세요! 공간 큐레이션 플랫폼 픽플(PickPl)에 오신 것을 진심으로 환영합니다.\n" +
                    "                </p>\n" +
                    "                <p style=\"font-size: 13.5px; font-weight: 500; color: #8B95A1; margin: 4px 0 0 0; line-height: 1.6;\">\n" +
                    "                    본인 인증 및 연동을 완료하기 위해 아래의 6자리 인증 코드를 입력창에 입력해주세요.\n" +
                    "                </p>\n" +
                    "            </div>\n" +
                    "            \n" +
                    "            <!-- 인증번호 박스 -->\n" +
                    "            <div style=\"background-color: #FFF9F7; border: 2px dashed #FFD2C4; border-radius: 20px; padding: 24px; text-align: center; margin-bottom: 32px;\">\n" +
                    "                <p style=\"font-size: 11px; font-weight: 800; color: #FF5F2E; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0;\">인증 번호</p>\n" +
                    "                <div style=\"font-size: 36px; font-weight: 800; color: #FF5F2E; letter-spacing: 6px; font-family: monospace; line-height: 1;\">" +
                    authCode +
                    "                </div>\n" +
                    "            </div>\n" +
                    "            \n" +
                    "            <div style=\"text-align: center;\">\n" +
                    "                <p style=\"font-size: 12px; font-weight: 500; color: #8B95A1; margin: 0; line-height: 1.5;\">\n" +
                    "                    인증 코드는 발송 후 <strong style=\"color: #FF5F2E;\">5분 동안</strong> 유효합니다.<br>\n" +
                    "                    시간이 지나면 만료되므로 인증을 다시 시도해주세요.\n" +
                    "                </p>\n" +
                    "                <p style=\"font-size: 11px; font-weight: 400; color: #B0B8C1; margin: 24px 0 0 0; border-top: 1px dashed #F2F4F6; padding-top: 16px;\">\n" +
                    "                    본 메일은 회원님의 요청에 의해 발송된 시스템 자동 메일입니다.<br>\n" +
                    "                    요청하지 않으셨다면 이 메일을 무시하셔도 안전합니다.\n" +
                    "                </p>\n" +
                    "            </div>\n" +
                    "        </div>\n" +
                    "        \n" +
                    "        <!-- 하단 푸터 -->\n" +
                    "        <div style=\"text-align: center; margin-top: 24px;\">\n" +
                    "            <p style=\"font-size: 11px; color: #B0B8C1; margin: 0;\">&copy; 2026 PickPl. All rights reserved.</p>\n" +
                    "        </div>\n" +
                    "    </div>\n" +
                    "</body>\n" +
                    "</html>";
            
            helper.setText(htmlContent, true);
            
            ClassPathResource logoResource = new ClassPathResource("static/images/pickpl_main_logo.png");
            if (logoResource.exists()) {
                helper.addInline("logo", logoResource);
            } else {
                System.out.println("[Warning] pickpl_main_logo.png 리소스가 존재하지 않아 인라인 이미지를 추가하지 못했습니다.");
            }
            
            mailSender.send(message);
            System.out.println("[SMTP Success] 이메일 발송 성공: " + email);
        } catch (Exception e) {
            System.err.println("[SMTP Error] 이메일 전송 중 예외 발생 (콘솔 코드로 대체합니다): " + e.getMessage());
        }
    }

    @Transactional
    public void verifyEmailCode(String userId, String code) {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        String redisCode = redisTemplate.opsForValue().get("EmailAuth:" + user.getEmail());
        if (redisCode == null) {
            throw new IllegalArgumentException("인증 시간이 초과되었거나 인증 요청 이력이 없습니다.");
        }

        if (!redisCode.equals(code)) {
            throw new IllegalArgumentException("인증 코드가 일치하지 않습니다.");
        }

        user.verifyEmail();
        redisTemplate.delete("EmailAuth:" + user.getEmail());
    }

    @Transactional
    public void linkSocialAccount(String userId, String provider, String providerId) {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        String upperProvider = provider.toUpperCase();

        if (socialConnectionRepository.existsByProviderAndProviderId(upperProvider, providerId)) {
            throw new IllegalArgumentException("이미 다른 계정에 연결되어 있는 소셜 계정입니다.");
        }

        boolean alreadyLinked = socialConnectionRepository.findByUserId(user.getId())
                .stream()
                .anyMatch(conn -> conn.getProvider().equals(upperProvider));
        if (alreadyLinked) {
            throw new IllegalArgumentException("이미 연동 완료된 소셜 플랫폼입니다.");
        }

        SocialConnection socialConnection = SocialConnection.builder()
                .user(user)
                .provider(upperProvider)
                .providerId(providerId)
                .build();

        socialConnectionRepository.save(socialConnection);
    }

    @Transactional
    public void recordUserSession(User user, String refreshToken) {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest req = attributes.getRequest();
                String ip = getClientIp(req);
                String userAgent = req.getHeader("User-Agent");
                
                com.pickpl.app.domain.user.UserSession userSession = com.pickpl.app.domain.user.UserSession.builder()
                        .user(user)
                        .refreshTokenUuid(refreshToken)
                        .ipAddress(ip)
                        .location(getIpLocation(ip))
                        .device(parseDevice(userAgent))
                        .browser(parseBrowser(userAgent))
                        .lastAccessedAt(java.time.LocalDateTime.now())
                        .build();
                
                userSessionRepository.save(userSession);
            }
        } catch (Exception e) {
            System.err.println("세션 기록 중 예외 발생: " + e.getMessage());
        }
    }

    private String getClientIp(jakarta.servlet.http.HttpServletRequest request) {
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
        if (ip == null || ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1")) {
            return "Seoul";
        }
        return "Seoul";
    }

    @Transactional(readOnly = true)
    public List<com.pickpl.app.auth.dto.UserSessionResponse> getActiveSessions(String userId, String currentRefreshToken) {
        return userSessionRepository.findByUserId(Long.valueOf(userId))
                .stream()
                .map(session -> com.pickpl.app.auth.dto.UserSessionResponse.of(session, currentRefreshToken))
                .toList();
    }

    @Transactional
    public void removeSession(String userId, Long sessionId) {
        com.pickpl.app.domain.user.UserSession session = userSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 세션입니다."));

        if (!session.getUser().getId().equals(Long.valueOf(userId))) {
            throw new org.springframework.security.access.AccessDeniedException("본인의 세션만 로그아웃할 수 있습니다.");
        }

        redisTemplate.delete("RT:" + userId + ":" + session.getRefreshTokenUuid());
        userSessionRepository.delete(session);
    }
}
