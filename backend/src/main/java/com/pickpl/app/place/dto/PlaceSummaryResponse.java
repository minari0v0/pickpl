package com.pickpl.app.place.dto;

import com.pickpl.app.domain.place.Place;
import com.pickpl.app.domain.place.PlaceTagMap;

import java.util.List;

/**
 * GET /api/places 응답에 사용되는 Place 요약 DTO.
 *
 * 엔티티를 직접 직렬화하지 않고 DTO를 사용하는 이유:
 *  1. 양방향 연관관계의 무한 순환 참조(Jackson 직렬화 오류) 방지
 *  2. API 응답 필드를 클라이언트 요구사항에 맞게 독립적으로 제어
 *  3. 내부 도메인 모델 변경 시 API 스펙을 안정적으로 유지
 */
public record PlaceSummaryResponse(
        Long id,
        String name,
        String thumbnailUrl,
        String address,
        String category,
        String aiMoodSummary,
        boolean isScrapped,
        List<TagInfo> tags,
        VibeStats vibeStats,
        String userVotedVibe,
        String editorsComment,
        boolean isPublished
) {

    public record VibeStats(int quiet, int chatty) {}

    /** 태그 정보 내부 레코드 */
    public record TagInfo(Long id, String name, String type) {}

    /** Place 엔티티 → DTO 변환 정적 팩토리 메서드 */
    public static PlaceSummaryResponse from(Place place, boolean isScrapped, String userVotedVibe) {
        List<TagInfo> tagInfos = place.getPlaceTagMaps().stream()
                .map(PlaceTagMap::getTag)
                .map(t -> new TagInfo(t.getId(), t.getName(), t.getType().name()))
                .toList();

        return new PlaceSummaryResponse(
                place.getId(),
                place.getName(),
                place.getThumbnailUrl(),
                place.getAddress(),
                place.getCategory(),
                place.getAiMoodSummary(),
                isScrapped,
                tagInfos,
                new VibeStats(place.getQuietVoteCount(), place.getChattyVoteCount()),
                userVotedVibe,
                place.getEditorsComment(),
                place.isPublished()
        );
    }
}
