package com.pickpl.app.auth.dto;

import java.util.List;

public record UserResponse(
    String email,
    String nickname,
    String profileImageUrl,
    String provider,
    boolean emailVerified,
    boolean onboarded,
    List<String> linkedProviders
) {
    public static UserResponse of(com.pickpl.app.domain.user.User user, List<String> linkedProviders) {
        return new UserResponse(
            user.getEmail(), 
            user.getNickname(), 
            user.getProfileImageUrl(), 
            user.getProvider().name(), 
            user.isEmailVerified(), 
            user.isOnboarded(), 
            linkedProviders
        );
    }
}
