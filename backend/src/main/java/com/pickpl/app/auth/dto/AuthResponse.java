package com.pickpl.app.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        Long userId,
        String nickname
) {
    public static AuthResponse of(String accessToken, String refreshToken, Long userId, String nickname) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", userId, nickname);
    }
}
