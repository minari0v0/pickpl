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
        boolean isScrapped,
        List<PlaceSummaryResponse.TagInfo> tags,
        PlaceSummaryResponse.VibeStats vibeStats,
        String userVotedVibe
) {
    public static PlaceDetailResponse from(Place place, boolean isScrapped, String userVotedVibe) {
        List<PlaceSummaryResponse.TagInfo> tagInfos = place.getPlaceTagMaps().stream()
                .map(PlaceTagMap::getTag)
                .map(t -> new PlaceSummaryResponse.TagInfo(t.getId(), t.getName(), t.getType().name()))
                .toList();

        // Parse JSON array string simply for now or split by comma if comma separated
        List<String> images = place.getImageUrls() != null 
                ? Arrays.asList(place.getImageUrls().split(",")) 
                : List.of(place.getThumbnailUrl());

        return new PlaceDetailResponse(
                place.getId(),
                place.getName(),
                place.getThumbnailUrl(),
                images,
                place.getAddress(),
                place.getCategory(),
                place.getAiMoodSummary(),
                false, // isHiddenGem
                isScrapped,
                tagInfos,
                new PlaceSummaryResponse.VibeStats(place.getQuietVoteCount(), place.getChattyVoteCount()),
                userVotedVibe
        );
    }
}
