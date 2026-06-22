package com.pickpl.app.auth.controller;

import com.pickpl.app.auth.dto.AuthResponse;
import com.pickpl.app.auth.dto.LoginRequest;
import com.pickpl.app.auth.dto.SignupRequest;
import com.pickpl.app.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.pickpl.app.security.jwt.JwtTokenProvider;

@Tag(name = "Auth", description = "인증 API")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "일반 회원가입")
    @PostMapping("/signup")
    public ResponseEntity<Long> signup(@RequestBody SignupRequest request) {
        Long userId = authService.signup(request);
        return ResponseEntity.ok(userId);
    }

    @Operation(summary = "일반 로그인", description = "로그인 성공 시 JWT 토큰을 반환합니다.")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "토큰 재발급", description = "만료된 Access Token을 Refresh Token을 사용해 재발급 받습니다.")
    @PostMapping("/reissue")
    public ResponseEntity<AuthResponse> reissue(@RequestBody com.pickpl.app.auth.dto.ReissueRequest request) {
        AuthResponse response = authService.reissue(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "닉네임 중복 확인", description = "닉네임의 중복 여부를 확인합니다. 사용 가능하면 true를 반환합니다.")
    @org.springframework.web.bind.annotation.GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNickname(@org.springframework.web.bind.annotation.RequestParam String nickname) {
        boolean isAvailable = authService.checkNickname(nickname);
        return ResponseEntity.ok(isAvailable);
    }

    @Operation(summary = "소셜 로그인 최초 가입", description = "GUEST 유저가 닉네임을 설정하여 USER로 전환합니다.")
    @PostMapping("/oauth-signup")
    public ResponseEntity<AuthResponse> oauthSignup(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @RequestBody com.pickpl.app.auth.dto.OAuthSignupRequest request) {
        // JwtAuthenticationFilter를 통해 SecurityContext에 저장된 UserDetails의 username은 유저 ID입니다.
        String userId = userDetails.getUsername();
        AuthResponse response = authService.oauthSignup(userId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "로그아웃", description = "Redis에 저장된 Refresh Token을 삭제합니다.")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        if (userDetails != null) {
            String userId = userDetails.getUsername();
            authService.logout(userId);
        }
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "내 프로필 조회")
    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<com.pickpl.app.auth.dto.UserResponse> getProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        com.pickpl.app.auth.dto.UserResponse response = authService.getProfile(userId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "내 프로필 수정")
    @org.springframework.web.bind.annotation.PostMapping("/me")
    public ResponseEntity<com.pickpl.app.auth.dto.UserResponse> updateProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @RequestBody com.pickpl.app.auth.dto.UpdateProfileRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        com.pickpl.app.auth.dto.UserResponse response = authService.updateProfile(userId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "비밀번호 변경", description = "일반 로그인 회원의 비밀번호를 변경합니다.")
    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @RequestBody com.pickpl.app.auth.dto.PasswordChangeRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        authService.changePassword(userId, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "회원 탈퇴", description = "현재 로그인된 회원의 계정을 삭제하고 로그아웃 처리합니다.")
    @org.springframework.web.bind.annotation.DeleteMapping("/me")
    public ResponseEntity<Void> withdraw(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        authService.withdraw(userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "외부 이미지 CORS 우회 프록시", description = "네이버 등 외부 프로필 이미지 로드 시 CORS 이슈를 우회하기 위한 프록시 API입니다.")
    @org.springframework.web.bind.annotation.GetMapping("/profile-proxy")
    public ResponseEntity<byte[]> getProfileImageProxy(@org.springframework.web.bind.annotation.RequestParam String url) {
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            byte[] imageBytes = restTemplate.getForObject(url, byte[].class);
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            
            if (url.toLowerCase().contains(".png")) {
                headers.setContentType(org.springframework.http.MediaType.IMAGE_PNG);
            } else if (url.toLowerCase().contains(".gif")) {
                headers.setContentType(org.springframework.http.MediaType.IMAGE_GIF);
            } else {
                headers.setContentType(org.springframework.http.MediaType.IMAGE_JPEG);
            }
            
            headers.setCacheControl(org.springframework.http.CacheControl.maxAge(1, java.util.concurrent.TimeUnit.DAYS));
            return new ResponseEntity<>(imageBytes, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "이메일 인증 메일 발송")
    @PostMapping("/email/verification-request")
    public ResponseEntity<Void> sendVerificationEmail(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        com.pickpl.app.auth.dto.UserResponse profile = authService.getProfile(userId);
        authService.sendVerificationEmail(profile.email());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "이메일 인증 코드 검증")
    @PostMapping("/email/verify")
    public ResponseEntity<Void> verifyEmail(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @RequestBody java.util.Map<String, String> payload) {
        if (userDetails == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        String code = payload.get("code");
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("인증 코드를 입력해주세요.");
        }
        authService.verifyEmailCode(userId, code);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "소셜 계정 수동 연동")
    @PostMapping("/link/{provider}")
    public ResponseEntity<Void> linkSocialAccount(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @org.springframework.web.bind.annotation.PathVariable String provider,
            @RequestBody java.util.Map<String, String> payload) {
        if (userDetails == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        String providerId = payload.get("providerId");
        if (providerId == null || providerId.isBlank()) {
            throw new IllegalArgumentException("소셜 연동 정보가 올바르지 않습니다.");
        }
        authService.linkSocialAccount(userId, provider, providerId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "로그인 기기 세션 목록 조회")
    @org.springframework.web.bind.annotation.GetMapping("/sessions")
    public ResponseEntity<java.util.List<com.pickpl.app.auth.dto.UserSessionResponse>> getActiveSessions(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String currentRefreshToken) {
        if (userDetails == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        java.util.List<com.pickpl.app.auth.dto.UserSessionResponse> sessions = authService.getActiveSessions(userId, currentRefreshToken);
        return ResponseEntity.ok(sessions);
    }

    @Operation(summary = "특정 로그인 기기 원격 로그아웃")
    @org.springframework.web.bind.annotation.DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> removeSession(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @org.springframework.web.bind.annotation.PathVariable Long sessionId) {
        if (userDetails == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        authService.removeSession(userId, sessionId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "소셜 계정 실제 연동 시작")
    @org.springframework.web.bind.annotation.GetMapping("/link/{provider}/init")
    public void initSocialLink(
            @org.springframework.web.bind.annotation.RequestParam String token,
            @org.springframework.web.bind.annotation.PathVariable String provider,
            jakarta.servlet.http.HttpServletRequest request,
            jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        
        if (token == null || token.isBlank() || !jwtTokenProvider.validateToken(token)) {
            response.sendRedirect("http://localhost:3000/mypage?linkError=" + java.net.URLEncoder.encode("인증 토큰이 올바르지 않습니다.", "UTF-8"));
            return;
        }
        org.springframework.security.core.Authentication authentication = jwtTokenProvider.getAuthentication(token);
        String userId = authentication.getName();
        
        jakarta.servlet.http.HttpSession session = request.getSession(true);
        session.setAttribute("link_user_id", userId);
        
        response.sendRedirect("/oauth2/authorization/" + provider.toLowerCase());
    }
}
