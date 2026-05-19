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

@Tag(name = "Auth", description = "인증 API")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
}
