package com.pickpl.app.curation.controller;

import com.pickpl.app.curation.dto.CurationResponse;
import com.pickpl.app.curation.service.CurationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Curation", description = "기상 및 계절 실시간 큐레이션 API")
@RestController
@RequestMapping("/api/v1/curation")
@RequiredArgsConstructor
public class CurationController {

    private final CurationService curationService;

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

    @Operation(
        summary = "실시간 감성 큐레이션 조회",
        description = "실시간 날씨(Open-Meteo)와 계절(월) 정보에 적합한 테마와 공간 리스트를 큐레이션하여 반환합니다."
    )
    @GetMapping
    public ResponseEntity<CurationResponse> getCuration(
            @Parameter(description = "사용자 기기 현재 위도 (거리 계산용)")
            @RequestParam(required = false) Double latitude,
            
            @Parameter(description = "사용자 기기 현재 경도 (거리 계산용)")
            @RequestParam(required = false) Double longitude,
            
            @AuthenticationPrincipal User user) {
        
        CurationResponse response = curationService.getCuration(getUserIdOrNull(user), latitude, longitude);
        return ResponseEntity.ok(response);
    }
}
