package com.pickpl.app.place.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "실시간 인기 무드 태그 요약 캐시 응답 DTO")
public class PopularMoodResponse {

    @Schema(description = "실시간 트렌드 랭킹 순위 (1~10위)", example = "1")
    private Integer ranking;

    @Schema(description = "태그 명칭", example = "비오는날")
    private String tagName;

    @Schema(description = "태그 정렬 유형 (TREND: 지금 뜨는, RISING: 새롭게 떠오르는, STEADY: 꾸준히 인기)", example = "TREND")
    private String tagType;

    @Schema(description = "추가 랭킹 통계 정보 (예: 최근 클릭수 증량)", example = "+23", nullable = true)
    private String detailValue;
}
