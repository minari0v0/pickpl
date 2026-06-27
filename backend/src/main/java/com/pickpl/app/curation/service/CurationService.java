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
    private final com.pickpl.app.domain.admin.AdminConfigRepository adminConfigRepository;
    private final com.pickpl.app.domain.place.PlaceRepository placeRepository;
    private final com.pickpl.app.domain.scrap.ScrapRepository scrapRepository;

    /**
     * 실시간 날씨 및 현재 계절에 맞춰 공간 감성 큐레이션을 제공합니다.
     * 어드민 수동 오버라이드 모드가 켜진 경우, 기상 정보를 무시하고 지정된 테마를 강제합니다.
     */
    public CurationResponse getCuration(Long userId, Double latitude, Double longitude) {
        // 0. 어드민 강제 수동 모드 설정 상태 조회
        String curationMode = adminConfigRepository.findById("curation_mode")
                .map(com.pickpl.app.domain.admin.AdminConfig::getConfigValue)
                .orElse("AUTO");

        String activeThemeName;
        String activeThemeTitle;
        String targetTagName;
        String curationThemeKey;

        if ("MANUAL".equals(curationMode)) {
            String manualThemeKey = adminConfigRepository.findById("curation_manual_theme")
                    .map(com.pickpl.app.domain.admin.AdminConfig::getConfigValue)
                    .orElse("rainy_indoor");

            curationThemeKey = manualThemeKey;

            switch (manualThemeKey) {
                case "rainy_indoor":
                    activeThemeName = "비오는날";
                    activeThemeTitle = "🌧️ 비 오는 날, 창밖을 보기 좋은 감성 공간";
                    targetTagName = "비오는날";
                    break;
                case "spring":
                    activeThemeName = "봄";
                    activeThemeTitle = "🌱 싱그러운 봄 햇살을 온전히 만끽하기 좋은 공간";
                    targetTagName = "햇살맛집";
                    break;
                case "summer":
                    activeThemeName = "여름";
                    activeThemeTitle = "🌊 무더위를 식혀줄 푸른 오아시스, 여름 휴가 추천";
                    targetTagName = "여름휴가";
                    break;
                case "autumn":
                    activeThemeName = "가을";
                    activeThemeTitle = "🍁 가을 단풍과 함께 감성이 무르익는 사색 명소";
                    targetTagName = "단풍구경";
                    break;
                case "wellness":
                    activeThemeName = "웰니스";
                    activeThemeTitle = "🍵 바쁜 일상 속 지친 마음을 차분히 녹여줄 웰니스 다도방";
                    targetTagName = "다도";
                    break;
                case "pet_friendly":
                    activeThemeName = "반려동물";
                    activeThemeTitle = "🐶 이번 주말엔 댕댕이와 함께! 펫 프렌들리 공간";
                    targetTagName = "애견동반";
                    break;
                case "night_market":
                    activeThemeName = "야시장";
                    activeThemeTitle = "🍺 시원한 밤바람과 함께하는 로컬 야시장 & 노포 감성";
                    targetTagName = "야장";
                    break;
                case "winter":
                default:
                    activeThemeName = "겨울";
                    activeThemeTitle = "❄️ 겨울의 찬 바람을 피해 머무는 따뜻한 온기";
                    targetTagName = "코지한";
                    curationThemeKey = "winter"; // 겨울 테마 키 정제
                    break;
            }
        } else {
            // 1. 실시간 기상 상태 조회 (자동 모드)
            String weatherState = weatherClient.getLiveWeatherState();

            // 2. 현재 날짜, 요일, 시간 획득
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.DayOfWeek day = now.getDayOfWeek();
            int hour = now.getHour();
            int currentMonth = now.getMonthValue();

            // 3. 기상 상태 및 요일/시간 매트릭스에 따른 테마/태그 매핑
            if ("RAINY".equals(weatherState)) {
                activeThemeName = "비오는날";
                activeThemeTitle = "🌧️ 비 오는 날, 창밖을 보기 좋은 감성 공간";
                targetTagName = "비오는날";
                curationThemeKey = "rainy_indoor";
            } else if ("SNOWY".equals(weatherState)) {
                activeThemeName = "눈오는날";
                activeThemeTitle = "❄️ 추위를 녹여줄 포근한 눈 오는 날의 아지트";
                targetTagName = "눈오는날";
                curationThemeKey = "winter";
            } else {
                // 날씨가 맑음(CLEAR)일 경우 요일/시간대 라이프스타일 트리거 적용
                if ((day == java.time.DayOfWeek.FRIDAY || day == java.time.DayOfWeek.SATURDAY) && (hour >= 17 || hour <= 2)) {
                    // 금/토 저녁 야시장/포차 노포 감성
                    activeThemeName = "야시장";
                    activeThemeTitle = "🍺 시원한 밤바람과 함께하는 로컬 야시장 & 노포 감성";
                    targetTagName = "야장";
                    curationThemeKey = "night_market";
                } else if ((day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) && (hour >= 9 && hour < 17)) {
                    // 주말 낮 댕댕이와 나들이
                    activeThemeName = "반려동물";
                    activeThemeTitle = "🐶 이번 주말엔 댕댕이와 함께! 펫 프렌들리 공간";
                    targetTagName = "애견동반";
                    curationThemeKey = "pet_friendly";
                } else if ((day == java.time.DayOfWeek.MONDAY || day == java.time.DayOfWeek.TUESDAY || day == java.time.DayOfWeek.WEDNESDAY || day == java.time.DayOfWeek.THURSDAY) && (hour >= 13 && hour < 17)) {
                    // 평일 낮 다도방/웰니스
                    activeThemeName = "웰니스";
                    activeThemeTitle = "🍵 바쁜 일상 속 지친 마음을 차분히 녹여줄 웰니스 다도방";
                    targetTagName = "다도";
                    curationThemeKey = "wellness";
                } else {
                    // 그 외 일반 계절 매트릭스 작동
                    if (currentMonth >= 3 && currentMonth <= 5) {
                        activeThemeName = "봄";
                        activeThemeTitle = "🌱 싱그러운 봄 햇살을 온전히 만끽하기 좋은 공간";
                        targetTagName = "햇살맛집";
                        curationThemeKey = "spring";
                    } else if (currentMonth >= 6 && currentMonth <= 8) {
                        activeThemeName = "여름";
                        activeThemeTitle = "🌊 무더위를 식혀줄 푸른 오아시스, 여름 휴가 추천";
                        targetTagName = "여름휴가";
                        curationThemeKey = "summer";
                    } else if (currentMonth >= 9 && currentMonth <= 11) {
                        activeThemeName = "가을";
                        activeThemeTitle = "🍁 가을 단풍과 함께 감성이 무르익는 사색 명소";
                        targetTagName = "단풍구경";
                        curationThemeKey = "autumn";
                    } else {
                        // 12월, 1월, 2월 겨울
                        activeThemeName = "겨울";
                        activeThemeTitle = "❄️ 겨울의 찬 바람을 피해 머무는 따뜻한 온기";
                        targetTagName = "코지한";
                        curationThemeKey = "winter";
                    }
                }
            }
        }

        List<PlaceSummaryResponse> places = java.util.Collections.emptyList();
        if (curationThemeKey != null) {
            places = placeService.findPlacesByCurationTheme(curationThemeKey, userId, latitude, longitude);
        }
        
        if (places.isEmpty()) {
            // 큐레이션 테마 적재 데이터가 없는 경우, 태그 기반 추천 공간을 최대 10개로 제한하여 노출 (Fallback)
            places = placeService.findPlacesByTags(List.of(targetTagName), userId, latitude, longitude);
            if (places.size() > 10) {
                places = places.subList(0, 10);
            }
        }

        return CurationResponse.of(activeThemeTitle, activeThemeName, places);
    }

    // 큐레이션 환경설정 조회
    public com.pickpl.app.curation.dto.CurationAdminDtos.CurationSettingResponse getCurationSettings() {
        String mode = adminConfigRepository.findById("curation_mode")
                .map(com.pickpl.app.domain.admin.AdminConfig::getConfigValue)
                .orElse("AUTO");
        String manualTheme = adminConfigRepository.findById("curation_manual_theme")
                .map(com.pickpl.app.domain.admin.AdminConfig::getConfigValue)
                .orElse("rainy_indoor");
        return new com.pickpl.app.curation.dto.CurationAdminDtos.CurationSettingResponse(mode, manualTheme);
    }

    // 큐레이션 환경설정 수정
    @Transactional
    public void updateCurationSettings(com.pickpl.app.curation.dto.CurationAdminDtos.CurationSettingUpdateRequest request) {
        String mode = request.getMode();
        if (!"AUTO".equals(mode) && !"MANUAL".equals(mode)) {
            throw new IllegalArgumentException("올바르지 않은 모드 값입니다 (AUTO 또는 MANUAL 필요).");
        }

        com.pickpl.app.domain.admin.AdminConfig modeConfig = adminConfigRepository.findById("curation_mode")
                .orElseGet(() -> new com.pickpl.app.domain.admin.AdminConfig("curation_mode", mode));
        modeConfig.setConfigValue(mode);
        adminConfigRepository.save(modeConfig);

        if (request.getManualTheme() != null && !request.getManualTheme().isBlank()) {
            String theme = request.getManualTheme();
            com.pickpl.app.domain.admin.AdminConfig themeConfig = adminConfigRepository.findById("curation_manual_theme")
                    .orElseGet(() -> new com.pickpl.app.domain.admin.AdminConfig("curation_manual_theme", theme));
            themeConfig.setConfigValue(theme);
            adminConfigRepository.save(themeConfig);
        }
    }

    // 특정 큐레이션 테마에 매핑된 공간 리스트 조회
    public org.springframework.data.domain.Page<com.pickpl.app.place.dto.PlaceSummaryResponse> getCurationPlaces(String theme, org.springframework.data.domain.Pageable pageable) {
        return placeRepository.findAllByCurationTheme(theme, pageable)
                .map(place -> com.pickpl.app.place.dto.PlaceSummaryResponse.from(place, false, null));
    }

    // 어드민 큐레이션 지정용 장소 검색
    public org.springframework.data.domain.Page<com.pickpl.app.place.dto.PlaceSummaryResponse> searchPlacesForMapping(String keyword, org.springframework.data.domain.Pageable pageable) {
        return placeRepository.findPlacesForAdminCurationSearch(keyword, pageable)
                .map(place -> com.pickpl.app.place.dto.PlaceSummaryResponse.from(place, false, null));
    }

    // 특정 공간의 큐레이션 테마 지정 및 해제
    @Transactional
    public void updatePlaceCurationTheme(Long placeId, com.pickpl.app.curation.dto.CurationAdminDtos.CurationThemeUpdateRequest request) {
        com.pickpl.app.domain.place.Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 ID의 공간이 존재하지 않습니다. ID: " + placeId));

        String targetTheme = request.getTheme();
        if (targetTheme == null || targetTheme.trim().isEmpty()) {
            place.setCurationTheme(null);
        } else {
            place.setCurationTheme(targetTheme.trim());
        }
        placeRepository.save(place);
    }

    // 큐레이션 테마별 통계 조회
    public java.util.List<com.pickpl.app.curation.dto.CurationAdminDtos.CurationThemeStatResponse> getCurationStats() {
        java.util.List<com.pickpl.app.curation.dto.CurationAdminDtos.CurationThemeStatResponse> stats = new java.util.ArrayList<>();

        // 8대 전체 코어/라이프스타일 테마 정의
        java.util.Map<String, String> themeNames = new java.util.LinkedHashMap<>();
        themeNames.put("spring", "봄 피크닉 🌸");
        themeNames.put("summer", "여름 바캉스 🌊");
        themeNames.put("autumn", "가을 단풍 🍁");
        themeNames.put("winter", "겨울 온천 ♨️");
        themeNames.put("rainy_indoor", "비오는 날 ☔");
        themeNames.put("wellness", "웰니스 다도 🍵");
        themeNames.put("pet_friendly", "반려동물 🐶");
        themeNames.put("night_market", "로컬 야시장 🍺");

        for (java.util.Map.Entry<String, String> entry : themeNames.entrySet()) {
            String key = entry.getKey();
            String name = entry.getValue();

            long total = placeRepository.countByCurationTheme(key);
            long published = placeRepository.countByCurationThemeAndIsPublishedTrue(key);
            long scraps = scrapRepository.countByPlaceCurationTheme(key);

            stats.add(com.pickpl.app.curation.dto.CurationAdminDtos.CurationThemeStatResponse.builder()
                    .themeKey(key)
                    .themeName(name)
                    .totalPlaces(total)
                    .publishedPlaces(published)
                    .totalScraps(scraps)
                    .build());
        }

        return stats;
    }
}
