package com.pickpl.app.user.controller;

import com.pickpl.app.user.dto.DashboardResponse;
import com.pickpl.app.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "User", description = "유저 프로필 & 대시보드 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "마이페이지 취향 대시보드 조회", description = "로그인 유저의 조회 로그 및 북마크 태그 분포를 기반으로 선호 무드 통계 및 뱃지 획득 정보를 조회합니다.")
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        DashboardResponse response = userService.getUserDashboard(userId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "대표 칭호 장착/해제", description = "수집 완료한 무드 뱃지 중 하나를 선택해 대표 칭호로 장착하거나 해제합니다. badgeTitle 파라미터가 없거나 비어있으면 장착 해제됩니다.")
    @PutMapping("/representative-badge")
    public ResponseEntity<Void> updateRepresentativeBadge(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "장착할 칭호명 (비어있으면 해제)", required = false) @RequestParam(required = false) String badgeTitle) {
        if (userDetails == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = userDetails.getUsername();
        userService.updateRepresentativeBadge(userId, badgeTitle);
        return ResponseEntity.ok().build();
    }
}
