package com.pickpl.app.auth.service;

import com.pickpl.app.auth.dto.AuthResponse;
import com.pickpl.app.auth.dto.LoginRequest;
import com.pickpl.app.auth.dto.SignupRequest;
import com.pickpl.app.domain.user.AuthProvider;
import com.pickpl.app.domain.user.Role;
import com.pickpl.app.domain.user.User;
import com.pickpl.app.domain.user.UserRepository;
import com.pickpl.app.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;

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

    @Transactional(readOnly = true)
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

        // Refresh Token을 Redis에 저장 (유효기간 설정)
        redisTemplate.opsForValue().set(
                "RT:" + user.getId(),
                refreshToken,
                14, // 14일
                java.util.concurrent.TimeUnit.DAYS
        );

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

        // 3. Redis 에서 User ID 를 기반으로 저장된 Refresh Token 값을 가져옵니다.
        String redisRefreshToken = redisTemplate.opsForValue().get("RT:" + userIdStr);
        if (org.springframework.util.ObjectUtils.isEmpty(redisRefreshToken)) {
            throw new IllegalArgumentException("로그아웃 된 사용자입니다.");
        }
        if (!redisRefreshToken.equals(request.refreshToken())) {
            throw new IllegalArgumentException("토큰의 유저 정보가 일치하지 않습니다.");
        }

        // 4. 새로운 토큰 생성
        User user = userRepository.findById(Long.valueOf(userIdStr))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        String newAccessToken = jwtTokenProvider.createToken(String.valueOf(user.getId()), user.getRole().name());
        String newRefreshToken = jwtTokenProvider.createRefreshToken();

        // 5. Refresh Token Redis 업데이트
        redisTemplate.opsForValue().set(
                "RT:" + user.getId(),
                newRefreshToken,
                14,
                java.util.concurrent.TimeUnit.DAYS
        );

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

    public void logout(String userId) {
        redisTemplate.delete("RT:" + userId);
    }

    @Transactional(readOnly = true)
    public com.pickpl.app.auth.dto.UserResponse getProfile(String userId) {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        return com.pickpl.app.auth.dto.UserResponse.of(user);
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
        return com.pickpl.app.auth.dto.UserResponse.of(user);
    }
}
