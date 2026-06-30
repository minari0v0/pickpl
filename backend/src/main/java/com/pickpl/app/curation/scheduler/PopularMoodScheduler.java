package com.pickpl.app.curation.scheduler;

import com.pickpl.app.domain.tag.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class PopularMoodScheduler {

    private final TagRepository tagRepository;
    private final TagClickLogRepository tagClickLogRepository;
    private final PopularMoodSummaryRepository popularMoodSummaryRepository;

    private record RisingScore(String tagName, double score) {}

    /**
     * 서버 기동 즉시 첫 캐시 테이블을 동기 연산하여 채워 넣습니다.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void initPopularMoodsCache() {
        log.info("[PopularMoodScheduler] 서버 구동 즉시 실시간 인기 무드 태그 캐시를 빌드합니다.");
        refreshPopularMoods();
    }

    /**
     * 매 30분 주기로 사용자 클릭 로그를 취합하여 삼원화(TREND, RISING, STEADY) 무드 태그를 배치 집계합니다.
     */
    @Scheduled(cron = "0 0/30 * * * *")
    @Transactional
    public void refreshPopularMoods() {
        try {
            log.info("[PopularMoodScheduler] 실시간 인기 무드 태그 배치 연산을 개시합니다.");

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime since7d = now.minusDays(7);
            LocalDateTime since7dPrev = now.minusDays(14); // 이전 주 비교용

            // 1. TREND (지금 뜨는 태그): 최근 7일 클릭 증가량 TOP 3
            //    이번주 클릭수 - 지난주 클릭수 = 순증가 델타
            List<TagClickLogRepository.PopularMoodDto> thisWeek = tagClickLogRepository.findTopMoodsInLast24Hours(since7d);
            List<TagClickLogRepository.PopularMoodDto> prevWeek = tagClickLogRepository.findTopMoodsInLast24Hours(since7dPrev);
            Map<String, Long> prevMap = prevWeek.stream().collect(Collectors.toMap(
                    TagClickLogRepository.PopularMoodDto::getTagName,
                    TagClickLogRepository.PopularMoodDto::getClickCount,
                    (a, b) -> a));

            // 중복 적재 배제용 집합
            Set<String> assignedTagNames = new HashSet<>();

            // 델타 정렬: 이번주 클릭수 - 이전주 클릭수
            List<TagClickLogRepository.PopularMoodDto> recentTrends = thisWeek.stream()
                    .filter(d -> d.getClickCount() > (prevMap.getOrDefault(d.getTagName(), 0L)))
                    .sorted(Comparator.comparingLong((TagClickLogRepository.PopularMoodDto d) ->
                            d.getClickCount() - prevMap.getOrDefault(d.getTagName(), 0L)).reversed())
                    .collect(Collectors.toList());

            // 2. RISING (새롭게 떠오르는 태그): 최근 7일 이내 최초 등장한 태그
            List<Tag> allTags = tagRepository.findAll();
            List<Tag> risingTags = allTags.stream()
                    .filter(tag -> {
                        long totalCount = tagClickLogRepository.countByTagName(tag.getName());
                        long recentCount = thisWeek.stream()
                                .filter(d -> d.getTagName().equals(tag.getName()))
                                .mapToLong(TagClickLogRepository.PopularMoodDto::getClickCount).sum();
                        // 전체 클릭수와 최근 7일 클릭수가 같으면 → 7일 이내 최초 등장
                        return totalCount > 0 && totalCount == recentCount;
                    })
                    .collect(Collectors.toList());

            // 3. STEADY (꾸준히 인기 있는 태그): 누적 스크랩 수 + 분위기 투표 수 총합
            Map<String, Long> steadyScoreMap = new HashMap<>();
            tagRepository.findTagScrapCounts().forEach(dto ->
                steadyScoreMap.merge(dto.getTagName(), dto.getCountValue(), Long::sum)
            );
            tagRepository.findTagVibeVoteCounts().forEach(dto ->
                steadyScoreMap.merge(dto.getTagName(), dto.getCountValue(), Long::sum)
            );

            // 데이터가 아예 없을 경우를 대비한 디폴트 태그 주입 (대형카페를 1등으로 지정하되 기존처럼 5개 범위로 한정)
            if (steadyScoreMap.isEmpty()) {
                steadyScoreMap.put("대형카페", 9999L);
                allTags.stream()
                        .filter(t -> !"대형카페".equals(t.getName()))
                        .limit(4)
                        .forEach(t -> steadyScoreMap.put(t.getName(), 1L));
            }

            List<Map.Entry<String, Long>> sortedSteadys = steadyScoreMap.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .collect(Collectors.toList());

            // 4. 캐시 테이블 비우고 순위별 삽입 진행
            popularMoodSummaryRepository.deleteAllInBatch();
            int ranking = 1;

            // TREND 적재 (상위 최대 3개)
            int trendCount = 0;
            for (TagClickLogRepository.PopularMoodDto dto : recentTrends) {
                if (trendCount >= 3) break;
                popularMoodSummaryRepository.save(new PopularMoodSummary(
                        ranking++,
                        dto.getTagName(),
                        "TREND",
                        "+" + dto.getClickCount()
                ));
                assignedTagNames.add(dto.getTagName());
                trendCount++;
            }

            // RISING 적재 (상위 최대 3개, TREND와 중복 제외)
            int risingCount = 0;
            for (Tag rt : risingTags) {
                if (risingCount >= 3) break;
                if (assignedTagNames.contains(rt.getName())) continue;
                
                popularMoodSummaryRepository.save(new PopularMoodSummary(
                        ranking++,
                        rt.getName(),
                        "RISING",
                        null
                ));
                assignedTagNames.add(rt.getName());
                risingCount++;
            }

            // STEADY 적재 (상위 최대 4개, TREND/RISING과 중복 제외)
            int steadyCount = 0;
            for (Map.Entry<String, Long> entry : sortedSteadys) {
                if (steadyCount >= 4) break;
                if (assignedTagNames.contains(entry.getKey())) continue;

                popularMoodSummaryRepository.save(new PopularMoodSummary(
                        ranking++,
                        entry.getKey(),
                        "STEADY",
                        null
                ));
                assignedTagNames.add(entry.getKey());
                steadyCount++;
            }

            log.info("[PopularMoodScheduler] 실시간 인기 무드 태그 집계 및 캐시 갱신 성공 (총 {}개 등재 완료)", ranking - 1);
        } catch (Exception e) {
            log.error("[PopularMoodScheduler Error] 배치 취합 중 에러 발생: ", e);
        }
    }
}
