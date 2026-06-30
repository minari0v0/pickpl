package com.pickpl.app.place.controller;

import com.pickpl.app.place.dto.PlaceSummaryResponse;
import com.pickpl.app.place.service.PlaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 공간(Place) 관련 REST API 컨트롤러.
 * Base URL: /api/places
 */
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;

@Tag(name = "Place", description = "공간(장소) 조회 API")
@RestController
@RequestMapping("/api/v1/places")
public class PlaceController {

    private final PlaceService placeService;
    private final com.pickpl.app.place.service.RecommendationService recommendationService;
    private final com.pickpl.app.domain.tag.TagClickLogRepository tagClickLogRepository;
    private final com.pickpl.app.domain.tag.PopularMoodSummaryRepository popularMoodSummaryRepository;

    public PlaceController(
            PlaceService placeService,
            com.pickpl.app.place.service.RecommendationService recommendationService,
            com.pickpl.app.domain.tag.TagClickLogRepository tagClickLogRepository,
            com.pickpl.app.domain.tag.PopularMoodSummaryRepository popularMoodSummaryRepository) {
        this.placeService = placeService;
        this.recommendationService = recommendationService;
        this.tagClickLogRepository = tagClickLogRepository;
        this.popularMoodSummaryRepository = popularMoodSummaryRepository;
    }

    private Long getUserIdOrNull(User user) {
        if (user == null || user.getUsername() == null || user.getUsername().equals("anonymousUser")) {
            return null;
        }
        try {
            return Long.parseLong(user.getUsername());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Operation(summary = "공간 목록 조회", description = "태그, 키워드 필터링 및 페이징을 지원하는 공간 목록 조회 API입니다.")
    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<PlaceSummaryResponse>> getPlaces(
            @io.swagger.v3.oas.annotations.Parameter(description = "조회 필터 무드/시설/날씨 태그 리스트 (교집합 검색)")
            @org.springframework.web.bind.annotation.RequestParam(required = false) List<String> tags,
            
            @io.swagger.v3.oas.annotations.Parameter(description = "장소명, 주소, 카테고리, 무드 요약 대상 키워드 검색어")
            @org.springframework.web.bind.annotation.RequestParam(required = false) String keyword,
            
            @io.swagger.v3.oas.annotations.Parameter(description = "사용자 현재 기기 위도 (거리 계산용)")
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double latitude,
            
            @io.swagger.v3.oas.annotations.Parameter(description = "사용자 현재 기기 경도 (거리 계산용)")
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double longitude,
            
            @io.swagger.v3.oas.annotations.Parameter(description = "조회 대상 페이지 번호 (0-based)")
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            
            @io.swagger.v3.oas.annotations.Parameter(description = "한 페이지당 조회 개수")
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "20") int size,
            
            @AuthenticationPrincipal User user) {
        
        // 검색 파라미터 값 정제
        String cleanedKeyword = (keyword != null) ? keyword.trim() : null;
        if (cleanedKeyword != null && cleanedKeyword.isEmpty()) {
            cleanedKeyword = null;
        }

        // 태그 값 정제 (빈 스트링 원소 제거)
        List<String> cleanedTags = null;
        if (tags != null) {
            cleanedTags = tags.stream()
                    .map(String::trim)
                    .filter(t -> !t.isEmpty())
                    .toList();
            if (cleanedTags.isEmpty()) {
                cleanedTags = null;
            }
        }

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "id"));
        
        if (cleanedTags == null && cleanedKeyword == null) {
            return ResponseEntity.ok(recommendationService.getPersonalizedPlacesPage(getUserIdOrNull(user), latitude, longitude, pageable));
        }
        
        return ResponseEntity.ok(placeService.findPlacesByTagsAndKeyword(cleanedTags, cleanedKeyword, getUserIdOrNull(user), latitude, longitude, pageable));
    }

    @Operation(summary = "공간 상세 조회", description = "특정 공간의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<com.pickpl.app.place.dto.PlaceDetailResponse> getPlace(
            @io.swagger.v3.oas.annotations.Parameter(description = "조회할 공간의 고유 ID")
            @org.springframework.web.bind.annotation.PathVariable Long id,
            
            @io.swagger.v3.oas.annotations.Parameter(description = "사용자 현재 기기 위도 (거리 계산용)")
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double latitude,
            
            @io.swagger.v3.oas.annotations.Parameter(description = "사용자 현재 기기 경도 (거리 계산용)")
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double longitude,
            
            @io.swagger.v3.oas.annotations.Parameter(description = "상세페이지 진입 시 인입 경로 태그명 (추천/검색 클릭 태그)")
            @org.springframework.web.bind.annotation.RequestParam(required = false) String inflowTag,
            
            @AuthenticationPrincipal User user) {
        Long userId = getUserIdOrNull(user);
        if (userId != null) {
            recommendationService.recordPlaceView(userId, id, inflowTag);
        }
        return ResponseEntity.ok(placeService.findPlaceById(id, userId, latitude, longitude));
    }

    @Operation(summary = "개인화 맞춤 추천 장소 조회", description = "로그인한 유저의 가중치 무드 맵과 Time-Decay를 적용하여 맞춤형 12개 장소를 추천합니다. 비로그인/스킵 시 인기 장소로 폴백합니다.")
    @GetMapping("/recommendations")
    public ResponseEntity<com.pickpl.app.place.dto.RecommendationResponse> getRecommendations(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(recommendationService.getPersonalizedRecommendations(getUserIdOrNull(user)));
    }

    @Operation(summary = "실시간 태그 클릭 이벤트 기록", description = "발견/탐색 탭에서 특정 무드 태그를 클릭했을 때 비동기 로깅 처리를 수행합니다.")
    @org.springframework.web.bind.annotation.PostMapping("/tags/click")
    public ResponseEntity<Void> logTagClick(
            @io.swagger.v3.oas.annotations.Parameter(description = "클릭된 분위기 태그명", required = true)
            @org.springframework.web.bind.annotation.RequestParam String tagName,
            @AuthenticationPrincipal User user) {
        tagClickLogRepository.save(new com.pickpl.app.domain.tag.TagClickLog(getUserIdOrNull(user), tagName));
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "실시간 삼원화 인기 무드 태그 목록 조회", description = "배치 스케줄러가 최근 클릭 가중치와 스크랩 점수를 조합하여 갱신해 둔 실시간 인기 태그 목록을 랭킹 순위대로 반환합니다.")
    @GetMapping("/tags/popular")
    public ResponseEntity<List<com.pickpl.app.place.dto.PopularMoodResponse>> getPopularMoods() {
        List<com.pickpl.app.place.dto.PopularMoodResponse> responses = popularMoodSummaryRepository.findAllByOrderByRankingAsc().stream()
                .map(summary -> com.pickpl.app.place.dto.PopularMoodResponse.builder()
                        .ranking(summary.getRanking())
                        .tagName(summary.getTagName())
                        .tagType(summary.getTagType())
                        .detailValue(summary.getDetailValue())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
}
