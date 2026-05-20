package com.pickpl.app.scrap.dto;

import com.pickpl.app.place.dto.PlaceSummaryResponse;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "스크랩(저장) 정보 응답")
public record ScrapResponse(
        @Schema(description = "스크랩 ID", example = "1")
        Long scrapId,

        @Schema(description = "스크랩 폴더 이름", example = "기본 저장소")
        String folderName,

        @Schema(description = "스크랩된 공간 요약 정보")
        PlaceSummaryResponse place
) {}
