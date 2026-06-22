package com.pickpl.app.place.dto;

import java.util.List;

public record PlaceBatchRequest(
        List<PlaceData> places
) {
    public record PlaceData(
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
            String curationTheme
    ) {}
}
