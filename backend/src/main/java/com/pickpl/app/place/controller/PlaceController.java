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

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
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

    @Operation(summary = "공간 목록 조회", description = "태그 교집합 필터링을 지원하는 공간 목록 조회 API입니다.")
    @GetMapping
    public ResponseEntity<List<PlaceSummaryResponse>> getPlaces(
            @org.springframework.web.bind.annotation.RequestParam(required = false) List<String> tags,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double latitude,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double longitude,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(placeService.findPlacesByTags(tags, getUserIdOrNull(user), latitude, longitude));
    }

    @Operation(summary = "공간 상세 조회", description = "특정 공간의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<com.pickpl.app.place.dto.PlaceDetailResponse> getPlace(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double latitude,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double longitude,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(placeService.findPlaceById(id, getUserIdOrNull(user), latitude, longitude));
    }
}
