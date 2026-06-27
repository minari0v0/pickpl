package com.pickpl.app.curation.controller;

import com.pickpl.app.curation.dto.CurationAdminDtos.*;
import com.pickpl.app.curation.service.CurationService;
import com.pickpl.app.place.dto.PlaceSummaryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "Admin Curation", description = "관리자 전용 큐레이션 및 테마 매핑 설정 API")
@RestController
@RequestMapping("/api/v1/admin/curation")
@RequiredArgsConstructor
public class AdminCurationController {

    private final CurationService curationService;

    @Operation(summary = "실시간 큐레이션 설정 조회", description = "기상청 실시간 자동 모드 혹은 특정 테마 강제 지정을 위한 설정 정보를 조회합니다.")
    @GetMapping("/settings")
    public ResponseEntity<CurationSettingResponse> getSettings() {
        return ResponseEntity.ok(curationService.getCurationSettings());
    }

    @Operation(summary = "실시간 큐레이션 설정 변경", description = "실시간 자동/수동 모드 설정 및 수동 고정 테마를 저장합니다.")
    @PutMapping("/settings")
    public ResponseEntity<Map<String, String>> updateSettings(
            @RequestBody CurationSettingUpdateRequest request) {
        curationService.updateCurationSettings(request);
        Map<String, String> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "큐레이션 모드/테마 설정이 저장되었습니다.");
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "큐레이션 테마별 장소 조회", description = "특정 큐레이션 테마에 매핑된 전체 장소 리스트를 페이징하여 조회합니다.")
    @GetMapping("/places")
    public ResponseEntity<Page<PlaceSummaryResponse>> getCurationPlaces(
            @Parameter(description = "조회 대상 테마 키 (spring, summer, autumn, winter, rainy_indoor)", required = true)
            @RequestParam String theme,
            @Parameter(description = "페이지 번호 (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "한 페이지당 조회 개수")
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok(curationService.getCurationPlaces(theme, pageable));
    }

    @Operation(summary = "일반 장소 검색", description = "공개 여부 상관없이 큐레이션 지정을 위해 장소명이나 주소로 전체 장소를 검색합니다.")
    @GetMapping("/places/search")
    public ResponseEntity<Page<PlaceSummaryResponse>> searchPlaces(
            @Parameter(description = "검색어 (장소명 또는 주소)", required = true)
            @RequestParam String keyword,
            @Parameter(description = "페이지 번호 (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "한 페이지당 조회 개수")
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok(curationService.searchPlacesForMapping(keyword, pageable));
    }

    @Operation(summary = "장소 큐레이션 테마 매핑 수정", description = "특정 장소의 큐레이션 테마(spring, summer 등)를 매핑하거나 해제합니다.")
    @PutMapping("/places/{placeId}/theme")
    public ResponseEntity<Map<String, String>> updatePlaceCurationTheme(
            @Parameter(description = "테마를 매핑/해제할 공간의 고유 ID", required = true)
            @PathVariable Long placeId,
            @RequestBody CurationThemeUpdateRequest request) {
        curationService.updatePlaceCurationTheme(placeId, request);
        Map<String, String> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "해당 장소의 큐레이션 테마 설정이 성공적으로 변경되었습니다.");
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "큐레이션 테마별 통계 조회", description = "각 큐레이션 테마별 총 장소 수, 공개 장소 수 및 누적 스크랩 수 통계를 집계하여 반환합니다.")
    @GetMapping("/stats")
    public ResponseEntity<List<CurationThemeStatResponse>> getStats() {
        return ResponseEntity.ok(curationService.getCurationStats());
    }
}
