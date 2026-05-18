package com.pickpl.app.auth.dto;

public record ReissueRequest(
        String accessToken,
        String refreshToken
) {}
