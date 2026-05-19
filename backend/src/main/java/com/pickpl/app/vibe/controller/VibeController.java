package com.pickpl.app.vibe.controller;

import com.pickpl.app.domain.vibe.VibeType;
import com.pickpl.app.vibe.service.VibeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Vibe", description = "분위기 투표 API")
@RestController
@RequestMapping("/api/v1/places/{placeId}/vibe")
public class VibeController {

    private final VibeService vibeService;

    public VibeController(VibeService vibeService) {
        this.vibeService = vibeService;
    }

    @Operation(summary = "분위기 투표", description = "특정 공간의 분위기에 투표합니다. (QUIET 또는 CHATTY)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "투표 성공"),
            @ApiResponse(responseCode = "400", description = "이미 투표한 공간이거나 존재하지 않는 공간"),
            @ApiResponse(responseCode = "401", description = "인증 실패")
    })
    @PostMapping
    public ResponseEntity<Void> voteVibe(
            @AuthenticationPrincipal User user,
            @PathVariable Long placeId,
            @RequestParam VibeType type) {
        Long userId = Long.parseLong(user.getUsername());
        vibeService.addVibeVote(userId, placeId, type);
        return ResponseEntity.ok().build();
    }
}
