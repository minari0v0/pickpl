package com.pickpl.app.auth.dto;

public record PasswordChangeRequest(
        String currentPassword,
        String newPassword
) {}
