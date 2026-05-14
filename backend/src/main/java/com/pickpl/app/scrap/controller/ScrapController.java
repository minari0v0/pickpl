package com.pickpl.app.scrap.controller;

import com.pickpl.app.scrap.service.ScrapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Scrap", description = "스크랩(저장) API")
@RestController
@RequestMapping("/api/v1/scraps")
public class ScrapController {

    private final ScrapService scrapService;

    public ScrapController(ScrapService scrapService) {
        this.scrapService = scrapService;
    }

    public record ScrapRequest(Long userId, Long placeId) {}

    @Operation(summary = "스크랩 토글", description = "특정 공간을 스크랩하거나 해제합니다.")
    @PostMapping
    public ResponseEntity<Boolean> toggleScrap(@RequestBody ScrapRequest request) {
        // 임시로 userId를 요청에서 받습니다. 나중에는 Security Context에서 가져옵니다.
        boolean isCreated = scrapService.toggleScrap(request.userId(), request.placeId());
        return ResponseEntity.ok(isCreated);
    }
}
