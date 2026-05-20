package com.pickpl.app.scrap.controller;

import com.pickpl.app.scrap.dto.ScrapResponse;
import com.pickpl.app.scrap.service.ScrapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import java.util.List;

@Tag(name = "Scrap", description = "스크랩(저장) API")
@RestController
@RequestMapping("/api/v1/scraps")
public class ScrapController {

    private final ScrapService scrapService;

    public ScrapController(ScrapService scrapService) {
        this.scrapService = scrapService;
    }

    @Operation(summary = "스크랩 목록 조회", description = "로그인한 사용자의 전체 스크랩 목록을 조회합니다. 폴더별 그룹화는 클라이언트에서 수행합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패")
    })
    @GetMapping
    public ResponseEntity<List<ScrapResponse>> getUserScraps(@AuthenticationPrincipal User user) {
        Long userId = Long.parseLong(user.getUsername());
        List<ScrapResponse> scraps = scrapService.getUserScraps(userId);
        return ResponseEntity.ok(scraps);
    }

    @Operation(summary = "스크랩 추가", description = "특정 공간을 특정 폴더에 스크랩(저장)합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "스크랩 성공"),
            @ApiResponse(responseCode = "400", description = "이미 스크랩한 공간이거나 존재하지 않는 공간"),
            @ApiResponse(responseCode = "401", description = "인증 실패")
    })
    @PostMapping("/{placeId}")
    public ResponseEntity<Void> addScrap(
            @AuthenticationPrincipal User user,
            @PathVariable Long placeId,
            @RequestParam(required = false, defaultValue = "기본 저장소") String folderName) {
        Long userId = Long.parseLong(user.getUsername());
        scrapService.addScrap(userId, placeId, folderName);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "스크랩 취소", description = "특정 공간의 스크랩을 취소합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "스크랩 취소 성공"),
            @ApiResponse(responseCode = "400", description = "스크랩되어 있지 않은 공간"),
            @ApiResponse(responseCode = "401", description = "인증 실패")
    })
    @DeleteMapping("/{placeId}")
    public ResponseEntity<Void> removeScrap(
            @AuthenticationPrincipal User user,
            @PathVariable Long placeId) {
        Long userId = Long.parseLong(user.getUsername());
        scrapService.removeScrap(userId, placeId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "스크랩 폴더명 변경", description = "스크랩 폴더 이름을 변경합니다. 해당 폴더 내의 모든 스크랩 폴더명이 일괄 수정됩니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "폴더명 변경 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 파라미터"),
            @ApiResponse(responseCode = "401", description = "인증 실패")
    })
    @PutMapping("/folders")
    public ResponseEntity<Void> renameFolder(
            @AuthenticationPrincipal User user,
            @RequestParam String oldFolderName,
            @RequestParam String newFolderName) {
        Long userId = Long.parseLong(user.getUsername());
        scrapService.renameFolder(userId, oldFolderName, newFolderName);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "스크랩 폴더 삭제", description = "스크랩 폴더를 삭제합니다. 해당 폴더 내의 모든 스크랩(저장) 데이터가 해제됩니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "폴더 삭제 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 파라미터"),
            @ApiResponse(responseCode = "401", description = "인증 실패")
    })
    @DeleteMapping("/folders")
    public ResponseEntity<Void> deleteFolder(
            @AuthenticationPrincipal User user,
            @RequestParam String folderName) {
        Long userId = Long.parseLong(user.getUsername());
        scrapService.deleteFolder(userId, folderName);
        return ResponseEntity.ok().build();
    }
}

