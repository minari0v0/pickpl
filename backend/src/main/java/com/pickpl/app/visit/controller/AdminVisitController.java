package com.pickpl.app.visit.controller;

import com.pickpl.app.visit.dto.AdminVisitResponse;
import com.pickpl.app.visit.service.VisitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin Visit Record", description = "관리자 전용 방문 기록 모더레이션 API")
@RestController
@RequestMapping("/api/v1/admin/visits")
public class AdminVisitController {

    private final VisitService visitService;

    public AdminVisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    @Operation(summary = "전체 방문 기록 목록 조회 (페이징)", description = "관리자 페이지에서 모니터링하기 위해 전체 공간에 달린 후기 리스트를 최신순으로 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "관리자 인증 실패")
    })
    @GetMapping
    public ResponseEntity<Page<AdminVisitResponse>> getAllVisits(
            @Parameter(description = "페이지 번호 (0-based)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "한 페이지 크기", example = "10") @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AdminVisitResponse> response = visitService.getAllVisitsForAdmin(pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "방문 기록 강제 삭제", description = "어뷰징이나 스팸으로 분류된 부적절한 방문 한줄평을 강제 삭제 조치합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "강제 삭제 성공"),
            @ApiResponse(responseCode = "401", description = "관리자 인증 실패"),
            @ApiResponse(responseCode = "404", description = "방문 기록을 찾을 수 없음")
    })
    @DeleteMapping("/{visitId}")
    public ResponseEntity<Void> forceDeleteVisit(
            @Parameter(description = "방문 기록 ID", example = "1") @PathVariable Long visitId) {
        visitService.deleteVisitRecordForAdmin(visitId);
        return ResponseEntity.noContent().build();
    }
}
