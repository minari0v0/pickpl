package com.pickpl.app.curation.service;

import com.pickpl.app.curation.client.WeatherClient;
import com.pickpl.app.curation.dto.CurationResponse;
import com.pickpl.app.place.dto.PlaceSummaryResponse;
import com.pickpl.app.place.service.PlaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CurationService {

    private final WeatherClient weatherClient;
    private final PlaceService placeService;

    /**
     * 실시간 날씨 및 현재 계절에 맞춰 공간 감성 큐레이션을 제공합니다.
     */
    public CurationResponse getCuration(Long userId, Double latitude, Double longitude) {
        // 1. 실시간 기상 상태 조회
        String weatherState = weatherClient.getLiveWeatherState();

        // 2. 현재 날짜 정보 획득
        int currentMonth = LocalDate.now().getMonthValue();

        // 3. 기상 상태 및 계절 판정 매트릭스에 따른 테마/태그 매핑
        String activeThemeName;
        String activeThemeTitle;
        String targetTagName;

        if ("RAINY".equals(weatherState)) {
            activeThemeName = "비오는날";
            activeThemeTitle = "🌧️ 비 오는 날, 창밖을 보기 좋은 감성 공간";
            targetTagName = "비오는날";
        } else if ("SNOWY".equals(weatherState)) {
            activeThemeName = "눈오는날";
            activeThemeTitle = "❄️ 추위를 녹여줄 포근한 눈 오는 날의 아지트";
            targetTagName = "눈오는날";
        } else {
            // 날씨가 맑음(CLEAR)일 경우 월별 계절 매트릭스 작동
            if (currentMonth >= 3 && currentMonth <= 5) {
                activeThemeName = "봄";
                activeThemeTitle = "🌱 싱그러운 봄 햇살을 온전히 만끽하기 좋은 공간";
                targetTagName = "햇살맛집";
            } else if (currentMonth >= 6 && currentMonth <= 8) {
                activeThemeName = "여름";
                activeThemeTitle = "🌊 무더위를 식혀줄 푸른 오아시스, 여름 휴가 추천";
                targetTagName = "여름휴가";
            } else if (currentMonth >= 9 && currentMonth <= 11) {
                activeThemeName = "가을";
                activeThemeTitle = "🍁 가을 단풍과 함께 감성이 무르익는 사색 명소";
                targetTagName = "단풍구경";
            } else {
                // 12월, 1월, 2월 겨울
                activeThemeName = "겨울";
                activeThemeTitle = "❄️ 겨울의 찬 바람을 피해 머무는 따뜻한 온기";
                targetTagName = "코지한";
            }
        }

        // 4. 결정된 타겟 무드 태그 기반 장소 조회 (거리 계산 및 스크랩 여부 포함)
        List<PlaceSummaryResponse> places = placeService.findPlacesByTags(
                List.of(targetTagName), 
                userId, 
                latitude, 
                longitude
        );

        // 5. 추천 큐레이션 공간 수 제한 (기획에 맞게 상위 최대 10개만 추천으로 노출하도록 함)
        if (places.size() > 10) {
            places = places.subList(0, 10);
        }

        return CurationResponse.of(activeThemeTitle, activeThemeName, places);
    }
}
