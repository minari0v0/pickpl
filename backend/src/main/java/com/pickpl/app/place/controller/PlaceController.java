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
@Tag(name = "Place", description = "공간(장소) 조회 API")
@RestController
@RequestMapping("/api/v1/places")
public class PlaceController {

    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
    }

    /**
     * 전체 공간 목록 또는 태그 기반 필터링 결과를 조회합니다.
     *
     * @param tags 필터링할 태그 리스트 (선택사항)
     * @return 공간 요약 정보 JSON 배열
     */
    @Operation(summary = "공간 목록 조회", description = "태그 교집합 필터링을 지원하는 공간 목록 조회 API입니다.")
    @GetMapping
    public ResponseEntity<List<PlaceSummaryResponse>> getPlaces(
            @org.springframework.web.bind.annotation.RequestParam(required = false) List<String> tags) {
        return ResponseEntity.ok(placeService.findPlacesByTags(tags));
    }

    @Operation(summary = "공간 상세 조회", description = "특정 공간의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<com.pickpl.app.place.dto.PlaceDetailResponse> getPlace(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity.ok(placeService.findPlaceById(id));
    }
}
