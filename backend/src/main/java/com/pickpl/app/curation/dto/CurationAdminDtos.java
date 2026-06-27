package com.pickpl.app.curation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

public class CurationAdminDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "큐레이션 실시간 테마 설정 정보")
    public static class CurationSettingResponse {
        @Schema(description = "동작 모드 (AUTO: 자동, MANUAL: 수동)", example = "AUTO")
        private String mode;

        @Schema(description = "수동 테마 키 (mode가 MANUAL일 때 적용)", example = "rainy_indoor")
        private String manualTheme;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "큐레이션 실시간 테마 설정 수정 요청")
    public static class CurationSettingUpdateRequest {
        @Schema(description = "동작 모드 (AUTO: 자동, MANUAL: 수동)", example = "MANUAL", requiredMode = Schema.RequiredMode.REQUIRED)
        private String mode;

        @Schema(description = "수동 테마 키 (mode가 MANUAL일 때 필수)", example = "rainy_indoor")
        private String manualTheme;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "큐레이션 테마별 통계 정보")
    public static class CurationThemeStatResponse {
        @Schema(description = "테마 키", example = "rainy_indoor")
        private String themeKey;

        @Schema(description = "테마명", example = "비오는 날 ☔")
        private String themeName;

        @Schema(description = "총 장소 개수", example = "15")
        private long totalPlaces;

        @Schema(description = "공개된 장소 개수", example = "12")
        private long publishedPlaces;

        @Schema(description = "누적 스크랩(북마크) 수", example = "143")
        private long totalScraps;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "장소 큐레이션 테마 매핑 수정 요청")
    public static class CurationThemeUpdateRequest {
        @Schema(description = "지정할 테마 키 (null이나 빈스트링 지정 시 테마 해제)", example = "rainy_indoor")
        private String theme;
    }
}
