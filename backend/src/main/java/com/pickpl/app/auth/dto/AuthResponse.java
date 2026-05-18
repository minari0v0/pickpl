package com.pickpl.app.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Long userId,
        String nickname
) {
    public static AuthResponse of(String accessToken, Long userId, String nickname) {
        return new AuthResponse(accessToken, "Bearer", userId, nickname);
    }
}
