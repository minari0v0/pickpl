package com.pickpl.app.auth.dto;

public record SignupRequest(
        String email,
        String password,
        String nickname
) {}
