package com.pickpl.app.auth.dto;

public record LoginRequest(
        String email,
        String password
) {}
