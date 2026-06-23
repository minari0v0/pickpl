package com.pickpl.app.curation.client;

import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Component
public class WeatherClient {

    private final RestTemplate restTemplate;
    
    // 서울시청 기준 위경도 고정
    private static final String WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast?latitude=37.566&longitude=126.978&current=weather_code";

    public WeatherClient() {
        // API 장애나 타임아웃으로 인해 백엔드가 블로킹되는 현상을 방지하기 위해 타임아웃 1.5초 설정
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(1500);
        factory.setReadTimeout(1500);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Open-Meteo WMO 코드를 분석하여 날씨 상태를 판정합니다.
     * @return RAINY, SNOWY, CLEAR 중 하나 (장애 시 CLEAR로 안전하게 Fallback)
     */
    public String getLiveWeatherState() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(WEATHER_API_URL, Map.class);
            if (response != null && response.containsKey("current")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> current = (Map<String, Object>) response.get("current");
                if (current != null && current.containsKey("weather_code")) {
                    Number codeNum = (Number) current.get("weather_code");
                    int code = codeNum.intValue();
                    return mapWmoCodeToWeatherState(code);
                }
            }
        } catch (Exception e) {
            System.err.println("[Weather API Error] 날씨 조회 실패 (기본값 CLEAR로 폴백): " + e.getMessage());
        }
        return "CLEAR";
    }

    private String mapWmoCodeToWeatherState(int code) {
        // 비 (Rainy) 관련 WMO 코드
        // 51, 53, 55 (이슬비), 56, 57 (얼어붙는 이슬비)
        // 61, 63, 65 (비), 66, 67 (얼어붙는 비)
        // 80, 81, 82 (소나기), 95 (뇌우), 96, 99 (우박 동반 뇌우)
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code == 95 || code == 96 || code == 99) {
            return "RAINY";
        }
        // 눈 (Snowy) 관련 WMO 코드
        // 71, 73, 75 (눈), 77 (가루눈), 85, 86 (소나기성 눈)
        if ((code >= 71 && code <= 77) || code == 85 || code == 86) {
            return "SNOWY";
        }
        // 맑음 혹은 대체로 흐림
        return "CLEAR";
    }
}
