package com.pickpl.app.place.dto;

import java.util.List;

/**
 * 어드민 패널에서 검수를 마치고 최종적으로 DB에 적재/발행을 요청하는 DTO.
 */
public record AdminPlacePublishRequest(
        List<PlacePublishData> places
) {
    public record PlacePublishData(
            String name,
            String address,
            String externalId,
            Double latitude,
            Double longitude,
            String category,
            String subCategory,
            String thumbnailUrl,
            String imageUrls,
            String aiMoodSummary,
            List<String> tags,
            String editorsComment,
            boolean isPublished,
            String curationTheme
    ) {}
}
