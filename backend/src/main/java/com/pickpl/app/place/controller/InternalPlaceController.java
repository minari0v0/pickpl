package com.pickpl.app.place.controller;

import com.pickpl.app.place.dto.PlaceBatchRequest;
import com.pickpl.app.place.service.PlaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Internal Place API", description = "데이터 주입용 내부 관리자 API")
@RestController
@RequestMapping("/api/v1/internal/places")
@RequiredArgsConstructor
public class InternalPlaceController {

    private final PlaceService placeService;

    @Value("${app.admin.secret-key}")
    private String adminSecretKey;

    @Operation(summary = "장소 대량 등록", description = "Python 크롤러가 수집한 데이터를 대량 등록합니다. (Admin Secret Key 필요)")
    @PostMapping("/batch")
    public ResponseEntity<String> batchInsertPlaces(
            @RequestHeader("X-Admin-Secret-Key") String requestSecretKey,
            @RequestBody PlaceBatchRequest request) {

        if (!adminSecretKey.equals(requestSecretKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("유효하지 않은 어드민 키입니다.");
        }

        int savedCount = placeService.saveBatch(request);
        return ResponseEntity.ok("성공적으로 " + savedCount + "개의 장소가 저장되었습니다.");
    }
}
