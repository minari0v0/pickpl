package com.pickpl.app.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "마이페이지 취향 대시보드 및 뱃지 업적 정보 응답")
public class DashboardResponse {

    @Schema(description = "집중/조용한 무드 비율 (0~100)", example = "60")
    private int pineCozyRatio;

    @Schema(description = "대화/친목 무드 비율 (0~100)", example = "30")
    private int coffeeChatRatio;

    @Schema(description = "이색/감성 무드 비율 (0~100)", example = "10")
    private int hipVibeRatio;

    @Schema(description = "대표 획득 뱃지명 (예: '조용한 탐험가 🌲', 없을 시 '취향 탐험가 🗺️')", example = "조용한 탐험가 🌲")
    private String representativeBadge;

    @Schema(description = "무드 뱃지 업적 상세 리스트")
    private List<BadgeDto> badges;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "무드 뱃지 업적 상세 정보")
    public static class BadgeDto {
        @Schema(description = "뱃지 고유 ID", example = "PINE_COZY")
        private String badgeId;

        @Schema(description = "뱃지 이름", example = "조용한 탐험가")
        private String badgeName;

        @Schema(description = "뱃지 상태 (LOCKED / PROGRESS / UNLOCKED)", example = "UNLOCKED")
        private String status;

        @Schema(description = "해금 진행률 (0~100)", example = "100")
        private int progressPercentage;

        @Schema(description = "뱃지 아이콘 이모지", example = "🌲")
        private String emoji;

        @Schema(description = "뱃지 해금 조건 설명", example = "집중/조용한 분위기 장소를 5회 이상 방문 혹은 저장")
        private String description;
    }
}
