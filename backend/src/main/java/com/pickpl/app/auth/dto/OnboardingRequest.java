package com.pickpl.app.auth.dto;

import java.util.List;

public record OnboardingRequest(
    List<String> tags
) {}
