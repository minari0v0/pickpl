package com.pickpl.app.auth.dto;

public record UserResponse(
    String email,
    String nickname,
    String profileImageUrl
) {
    public static UserResponse of(com.pickpl.app.domain.user.User user) {
        return new UserResponse(user.getEmail(), user.getNickname(), user.getProfileImageUrl());
    }
}
