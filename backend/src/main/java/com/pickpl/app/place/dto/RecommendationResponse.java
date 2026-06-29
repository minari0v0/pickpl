package com.pickpl.app.place.dto;

import java.util.List;

public record RecommendationResponse(
    String recommendationType,      // "PERSONALIZED_HYBRID" 또는 "POPULAR_FALLBACK"
    String userPrimaryMood,          // 사용자가 가장 많이 선호하는 대표 무드 태그
    List<PlaceSummaryResponse> recommendedPlaces
) {}
