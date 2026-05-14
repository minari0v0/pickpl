package com.pickpl.app.place.dto;

import com.pickpl.app.domain.place.Place;
import com.pickpl.app.domain.place.PlaceTagMap;

import java.util.List;
import java.util.Arrays;

public record PlaceDetailResponse(
        Long id,
        String name,
        String thumbnailUrl,
        List<String> imageUrls,
        String address,
        String category,
        String aiMoodSummary,
        boolean isHiddenGem,
        List<PlaceSummaryResponse.TagInfo> tags
) {
    public static PlaceDetailResponse from(Place place) {
        List<PlaceSummaryResponse.TagInfo> tagInfos = place.getPlaceTagMaps().stream()
                .map(PlaceTagMap::getTag)
                .map(t -> new PlaceSummaryResponse.TagInfo(t.getId(), t.getName(), t.getType().name()))
                .toList();

        // Parse JSON array string simply for now or split by comma if comma separated
        List<String> images = place.getImageUrls() != null 
                ? Arrays.asList(place.getImageUrls().split(",")) 
                : List.of(place.getThumbnailUrl());

        // Dummy logic for hidden gem for MVP
        boolean isHiddenGem = place.getId() % 3 == 0;

        return new PlaceDetailResponse(
                place.getId(),
                place.getName(),
                place.getThumbnailUrl(),
                images,
                place.getAddress(),
                place.getCategory(),
                place.getAiMoodSummary(),
                isHiddenGem,
                tagInfos
        );
    }
}
