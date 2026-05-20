package com.pickpl.app.auth.dto;

public record UpdateProfileRequest(
    String nickname,
    String profileImageUrl
) {}
