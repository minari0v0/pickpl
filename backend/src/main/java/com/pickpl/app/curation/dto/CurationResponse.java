package com.pickpl.app.curation.dto;

import com.pickpl.app.place.dto.PlaceSummaryResponse;
import java.util.List;

/**
 * 실시간 감성 큐레이션 API 응답 DTO.
 */
public record CurationResponse(
    String activeThemeTitle,
    String activeThemeName,
    List<PlaceSummaryResponse> places
) {
    public static CurationResponse of(String activeThemeTitle, String activeThemeName, List<PlaceSummaryResponse> places) {
        return new CurationResponse(activeThemeTitle, activeThemeName, places);
    }
}
