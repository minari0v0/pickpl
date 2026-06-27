package com.pickpl.app.visit.controller;

import com.pickpl.app.visit.dto.VisitRecordRequest;
import com.pickpl.app.visit.dto.VisitRecordResponse;
import com.pickpl.app.visit.service.VisitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Visit Record", description = "방문 기록(체크인) API")
@RestController
@RequestMapping("/api/v1")
public class VisitController {

    private final VisitService visitService;

    public VisitController(VisitService visitService) {
        this.visitService = visitService;
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

    @Operation(summary = "방문 기록 등록", description = "로그인한 유저가 특정 공간에 방문 후기 한줄평과 날짜를 등록합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "등록 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 파라미터"),
            @ApiResponse(responseCode = "401", description = "로그인 인증 실패")
    })
    @PostMapping("/visits")
    public ResponseEntity<Void> addVisit(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody VisitRecordRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Long userId = Long.parseLong(user.getUsername());
        visitService.addVisitRecord(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "특정 공간의 방문 기록 목록 조회", description = "특정 장소(placeId)에 달린 픽플러들의 최신 방문 한줄평 목록을 가져옵니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "공간 정보를 찾을 수 없음")
    })
    @GetMapping("/places/{placeId}/visits")
    public ResponseEntity<List<VisitRecordResponse>> getPlaceVisits(
            @AuthenticationPrincipal User user,
            @Parameter(description = "장소 ID", example = "12") @PathVariable Long placeId) {
        Long currentUserId = getUserIdOrNull(user);
        List<VisitRecordResponse> response = visitService.getVisitRecords(placeId, currentUserId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "방문 기록 수정", description = "본인이 작성한 방문 기록(한줄평, 방문일자)을 수정합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "403", description = "수정 권한 없음"),
            @ApiResponse(responseCode = "404", description = "방문 기록을 찾을 수 없음")
    })
    @PutMapping("/visits/{visitId}")
    public ResponseEntity<Void> updateVisit(
            @AuthenticationPrincipal User user,
            @Parameter(description = "방문 기록 ID", example = "1") @PathVariable Long visitId,
            @Valid @RequestBody VisitRecordRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Long userId = Long.parseLong(user.getUsername());
        try {
            visitService.updateVisitRecord(userId, visitId, request);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @Operation(summary = "방문 기록 삭제", description = "본인이 작성한 방문 기록을 삭제합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "삭제 성공"),
            @ApiResponse(responseCode = "403", description = "삭제 권한 없음"),
            @ApiResponse(responseCode = "404", description = "방문 기록을 찾을 수 없음")
    })
    @DeleteMapping("/visits/{visitId}")
    public ResponseEntity<Void> deleteVisit(
            @AuthenticationPrincipal User user,
            @Parameter(description = "방문 기록 ID", example = "1") @PathVariable Long visitId) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Long userId = Long.parseLong(user.getUsername());
        try {
            visitService.deleteVisitRecord(userId, visitId);
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
