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
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
    }

    /**
     * 전체 공간 목록을 조회합니다.
     *
     * @return 공간 요약 정보 JSON 배열
     */
    @Operation(summary = "전체 공간 목록 조회", description = "DB에 저장된 모든 공간과 무드 태그를 JSON으로 반환합니다.")
    @GetMapping
    public ResponseEntity<List<PlaceSummaryResponse>> getPlaces() {
        return ResponseEntity.ok(placeService.findAllPlaces());
    }
}
