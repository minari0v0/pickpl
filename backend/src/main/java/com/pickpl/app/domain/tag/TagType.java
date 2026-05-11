package com.example.demo.domain.tag;

/**
 * AI 태그 유형 분류.
 *
 * Gemini API가 반환하는 JSON 키와 1:1 대응됩니다.
 * { "mood": [...], "facility": [...] }
 */
public enum TagType {

    /** 분위기 태그: 우드톤, 코지함, 빈티지, 모던, 플랜테리어 등 */
    MOOD,

    /** 시설/편의 태그: 콘센트석, 노트북가능, 주차가능, 반려동물 등 */
    FACILITY,

    /** 날씨/상황 태그: 비오는날, 야외테라스, 루프탑 등 */
    WEATHER
}
