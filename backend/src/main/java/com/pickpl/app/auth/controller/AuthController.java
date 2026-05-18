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
}
