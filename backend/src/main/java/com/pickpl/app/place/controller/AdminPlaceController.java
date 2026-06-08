package com.pickpl.app.place.controller;

import com.pickpl.app.place.dto.AdminPlacePublishRequest;
import com.pickpl.app.place.service.PlaceService;
import com.pickpl.app.domain.place.PlaceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 관리자 전용 공간(Place) 관리 REST API 컨트롤러.
 * Base URL: /api/v1/admin/places
 */
@Tag(name = "Admin Place", description = "관리자 전용 공간(장소) 등록 및 관리 API")
@RestController
@RequestMapping("/api/v1/admin/places")
public class AdminPlaceController {

    private final PlaceService placeService;
    private final PlaceRepository placeRepository;
    private final com.pickpl.app.security.admin.AdminKeyService adminKeyService;

    public AdminPlaceController(PlaceService placeService, PlaceRepository placeRepository, com.pickpl.app.security.admin.AdminKeyService adminKeyService) {
        this.placeService = placeService;
        this.placeRepository = placeRepository;
        this.adminKeyService = adminKeyService;
    }

    @Operation(summary = "수집된 장소 중복 검사", description = "가등록 예정인 장소들의 externalId 목록을 받아, 이미 DB에 적재되어 있는지 확인하여 Boolean 맵으로 반환합니다.")
    @PostMapping("/check-duplicates")
    public ResponseEntity<Map<String, Boolean>> checkDuplicates(@RequestBody List<String> externalIds) {
        Map<String, Boolean> duplicatesMap = new HashMap<>();
        if (externalIds != null) {
            for (String extId : externalIds) {
                duplicatesMap.put(extId, placeRepository.existsByExternalId(extId));
            }
        }
        return ResponseEntity.ok(duplicatesMap);
    }

    @Operation(summary = "검수 장소 일괄 주입 및 발행", description = "어드민이 수정한 에디터 한마디, 태그, 공개여부를 반영하여 장소를 일괄 적재 및 업데이트합니다.")
    @PostMapping("/batch-publish")
    public ResponseEntity<Map<String, Object>> publishBatch(@RequestBody AdminPlacePublishRequest request) {
        int processedCount = placeService.publishBatch(request);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "성공적으로 " + processedCount + "개의 공간 데이터 적재/갱신을 완료했습니다.");
        response.put("processedCount", processedCount);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "적재된 전체 공간 조회", description = "관리자용으로 공개여부 상관없이 데이터베이스에 등록된 전체 장소 목록을 반환합니다.")
    @GetMapping
    public ResponseEntity<List<com.pickpl.app.place.dto.PlaceSummaryResponse>> getAllPlaces() {
        return ResponseEntity.ok(placeService.findAllPlacesForAdmin());
    }

    @Operation(summary = "적재된 단건 공간 수정", description = "DB에 이미 적재된 특정 공간의 정보를 개별 수정(에디터 한마디, 태그, 상태 등)합니다.")
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, String>> updatePlace(
            @PathVariable Long id, 
            @RequestBody com.pickpl.app.place.dto.AdminPlacePublishRequest.PlacePublishData data) {
        placeService.updatePlace(id, data);
        Map<String, String> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "성공적으로 공간 정보를 수정했습니다.");
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "적재된 공간 삭제", description = "DB에서 특정 공간 정보를 영구히 삭제합니다.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePlace(@PathVariable Long id) {
        placeService.deletePlace(id);
        Map<String, String> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "성공적으로 공간을 삭제했습니다.");
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "전체 비공개 장소 일괄 공개 전환", description = "데이터베이스에 비공개 상태로 대기 중인 모든 공간을 일괄 공개 상태로 전환합니다.")
    @PostMapping("/publish-all")
    public ResponseEntity<Map<String, Object>> publishAll() {
        int publishedCount = placeService.publishAllPlaces();
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "성공적으로 " + publishedCount + "개의 공간을 공개 상태로 전환했습니다.");
        response.put("publishedCount", publishedCount);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "선택한 장소들 공개 상태 일괄 변경", description = "선택한 장소 ID 목록과 타겟 공개 여부 값을 받아 일괄 업데이트합니다.")
    @PostMapping("/bulk-publish-status")
    public ResponseEntity<Map<String, Object>> bulkPublishStatus(@RequestBody BulkStatusRequest request) {
        int updatedCount = placeService.updatePublishStatusBulk(request.getIds(), request.getIsPublished());
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "성공적으로 " + updatedCount + "개의 공간 상태를 변경했습니다.");
        response.put("updatedCount", updatedCount);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "관리자 비밀번호 변경", description = "관리자 비밀번호를 변경하여 DB에 영구 저장합니다.")
    @PutMapping("/settings/password")
    public ResponseEntity<Map<String, String>> changeAdminPassword(
            @RequestBody Map<String, String> request) {
        String newPassword = request.get("newPassword");
        adminKeyService.updateAdminKey(newPassword);
        Map<String, String> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "관리자 비밀번호가 성공적으로 변경되었습니다.");
        return ResponseEntity.ok(response);
    }

    public static class BulkStatusRequest {
        private List<Long> ids;
        private Boolean isPublished;

        public List<Long> getIds() { return ids; }
        public void setIds(List<Long> ids) { this.ids = ids; }

        public Boolean getIsPublished() { return isPublished; }
        public void setIsPublished(Boolean isPublished) { this.isPublished = isPublished; }
    }
}

