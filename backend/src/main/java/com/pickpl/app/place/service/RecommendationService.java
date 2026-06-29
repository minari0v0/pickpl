package com.pickpl.app.place.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pickpl.app.domain.place.Place;
import com.pickpl.app.domain.place.PlaceRepository;
import com.pickpl.app.domain.place.PlaceViewLog;
import com.pickpl.app.domain.place.PlaceViewLogRepository;
import com.pickpl.app.domain.scrap.Scrap;
import com.pickpl.app.domain.scrap.ScrapRepository;
import com.pickpl.app.domain.user.User;
import com.pickpl.app.domain.user.UserRepository;
import com.pickpl.app.domain.user.UserPreferenceTag;
import com.pickpl.app.domain.user.UserPreferenceTagRepository;
import com.pickpl.app.domain.vibe.VibeVote;
import com.pickpl.app.domain.vibe.VibeVoteRepository;
import com.pickpl.app.place.dto.PlaceSummaryResponse;
import com.pickpl.app.place.dto.RecommendationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;
    private final UserPreferenceTagRepository userPreferenceTagRepository;
    private final PlaceViewLogRepository placeViewLogRepository;
    private final VibeVoteRepository vibeVoteRepository;
    private final ScrapRepository scrapRepository;
    private final StringRedisTemplate redisTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String REDIS_CACHE_KEY_PREFIX = "user:vibe-vector:";

    /**
     * 사용자의 상세 페이지 조회 기록을 비동기/동기적으로 저장합니다.
     */
    @Transactional
    public void recordPlaceView(Long userId, Long placeId, String inflowTag) {
        User user = userRepository.findById(userId).orElse(null);
        Place place = placeRepository.findById(placeId).orElse(null);
        if (user != null && place != null) {
            PlaceViewLog logEntry = new PlaceViewLog(user, place, inflowTag);
            placeViewLogRepository.save(logEntry);
            // 취향 가중치 갱신을 위해 Redis 캐시 삭제
            redisTemplate.delete(REDIS_CACHE_KEY_PREFIX + userId);
        }
    }

    /**
     * 메인 피드(아래 영역)의 초개인화 정렬 페이징 목록을 반환합니다.
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<PlaceSummaryResponse> getPersonalizedPlacesPage(
            Long userId, Double latitude, Double longitude, org.springframework.data.domain.Pageable pageable) {
        
        // 1. 비로그인 세션인 경우 인기 큐레이션 폴백 페이징
        if (userId == null) {
            return getPopularPlacesPage(pageable, null, latitude, longitude);
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return getPopularPlacesPage(pageable, null, latitude, longitude);
        }

        // 2. 사용자의 취향 가중치 맵 획득 (Redis 캐싱 탑재)
        Map<String, Double> userPreferences = getUserPreferenceVector(userId);
        if (userPreferences.isEmpty()) {
            // 온보딩 스킵 회원은 대중적 인기 페이징
            return getPopularPlacesPage(pageable, userId, latitude, longitude);
        }

        // 3. 1단계: Retrieval (후보 장소군 150건 추출)
        List<String> topTags = userPreferences.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        Set<Place> candidates = new HashSet<>();
        if (!topTags.isEmpty()) {
            candidates.addAll(placeRepository.findTop100ByTagNames(topTags, PageRequest.of(0, 100)));
        }
        candidates.addAll(placeRepository.findAllByIsPublishedTrue(
                PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "id"))
        ).getContent());

        // 4. 2단계: Ranking (메모리 정렬 및 유사도 내적 계산)
        List<ScoredPlace> scoredPlaces = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Place place : candidates) {
            double matchScore = 0.0;
            List<String> placeTags = place.getPlaceTagMaps().stream()
                    .map(m -> m.getTag().getName())
                    .toList();

            for (String tag : placeTags) {
                matchScore += userPreferences.getOrDefault(tag, 0.0);
            }

            if (matchScore <= 0) {
                matchScore = 0.1;
            }

            long days = 0;
            if (place.getCreatedAt() != null) {
                days = Duration.between(place.getCreatedAt(), now).toDays();
            }
            double timeDecay = Math.exp(-0.05 * Math.max(0, days));
            double finalScore = matchScore * timeDecay;

            scoredPlaces.add(new ScoredPlace(place, finalScore, matchScore));
        }

        // 최종 스코어 기반 내림차순 정렬
        List<Place> sortedPlaces = scoredPlaces.stream()
                .sorted(Comparator.comparingDouble(ScoredPlace::finalScore).reversed())
                .map(ScoredPlace::place)
                .collect(Collectors.toList());

        // 5. 로그인 유저의 메타데이터(스크랩 여부, 투표 기록) 집계
        Set<Long> scrappedPlaceIds = new HashSet<>(scrapRepository.findScrappedPlaceIdsByUserId(userId));
        List<VibeVote> votes = vibeVoteRepository.findByUserId(userId);
        Map<Long, String> vibeVotesMap = votes.stream()
                .collect(Collectors.toMap(
                        v -> v.getPlace().getId(),
                        v -> v.getVibeType().name(),
                        (existing, replacement) -> existing
                ));

        // DTO 변환
        List<PlaceSummaryResponse> recommended = sortedPlaces.stream()
                .map(place -> {
                    String distanceStr = calculateDistanceStr(place, latitude, longitude);
                    return PlaceSummaryResponse.from(
                            place, 
                            scrappedPlaceIds.contains(place.getId()), 
                            vibeVotesMap.get(place.getId()), 
                            distanceStr
                    );
                })
                .collect(Collectors.toList());

        // 6. 메모리 상 페이징 서브리스트 처리
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), recommended.size());
        List<PlaceSummaryResponse> pageContent = new ArrayList<>();
        if (start < recommended.size()) {
            pageContent = recommended.subList(start, end);
        }

        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, recommended.size());
    }

    /**
     * 비로그인/스킵 회원을 위한 디폴트 인기/최신순 공간 페이징 목록 조회
     */
    private org.springframework.data.domain.Page<PlaceSummaryResponse> getPopularPlacesPage(
            org.springframework.data.domain.Pageable pageable, Long userId, Double latitude, Double longitude) {
        
        org.springframework.data.domain.Page<Place> placesPage = placeRepository.findAllByIsPublishedTrue(pageable);

        Set<Long> scrappedPlaceIds = new HashSet<>();
        Map<Long, String> vibeVotesMap = new HashMap<>();

        if (userId != null) {
            scrappedPlaceIds.addAll(scrapRepository.findScrappedPlaceIdsByUserId(userId));
            List<VibeVote> votes = vibeVoteRepository.findByUserId(userId);
            vibeVotesMap = votes.stream()
                    .collect(Collectors.toMap(
                            v -> v.getPlace().getId(),
                            v -> v.getVibeType().name(),
                            (existing, replacement) -> existing
                    ));
        }

        final Set<Long> finalScrapped = scrappedPlaceIds;
        final Map<Long, String> finalVotes = vibeVotesMap;

        return placesPage.map(place -> {
            String distanceStr = calculateDistanceStr(place, latitude, longitude);
            return PlaceSummaryResponse.from(
                    place, 
                    finalScrapped.contains(place.getId()), 
                    finalVotes.get(place.getId()), 
                    distanceStr
            );
        });
    }

    /**
     * 두 지점 간의 위경도 기반 거리를 포맷 스트링으로 계산합니다.
     */
    private String calculateDistanceStr(Place place, Double userLat, Double userLon) {
        if (userLat == null || userLon == null || place.getLatitude() == null || place.getLongitude() == null) {
            return null;
        }
        double theta = userLon - place.getLongitude();
        double dist = Math.sin(Math.toRadians(userLat)) * Math.sin(Math.toRadians(place.getLatitude()))
                + Math.cos(Math.toRadians(userLat)) * Math.cos(Math.toRadians(place.getLatitude())) * Math.cos(Math.toRadians(theta));
        dist = Math.acos(dist);
        dist = Math.toDegrees(dist);
        dist = dist * 60 * 1.1515 * 1.609344; // 킬로미터 변환
        
        if (dist < 1.0) {
            return String.format("내 위치에서 %d" + "m", (int)(dist * 1000));
        } else {
            return String.format("내 위치에서 %.1f" + "km", dist);
        }
    }

    /**
     * 초개인화된 맞춤 추천 장소 목록을 반환합니다. (가로 슬라이더 API용 - 레거시 호환 유지)
     */
    @Transactional(readOnly = true)
    public RecommendationResponse getPersonalizedRecommendations(Long userId) {
        if (userId == null) {
            return getPopularFallback();
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return getPopularFallback();
        }

        Map<String, Double> userPreferences = getUserPreferenceVector(userId);
        if (userPreferences.isEmpty()) {
            return getPopularFallback();
        }

        String primaryMood = userPreferences.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        List<String> topTags = userPreferences.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        Set<Place> candidates = new HashSet<>();
        if (!topTags.isEmpty()) {
            candidates.addAll(placeRepository.findTop100ByTagNames(topTags, PageRequest.of(0, 100)));
        }
        candidates.addAll(placeRepository.findAllByIsPublishedTrue(
                PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "id"))
        ).getContent());

        List<ScoredPlace> scoredPlaces = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Place place : candidates) {
            double matchScore = 0.0;
            List<String> placeTags = place.getPlaceTagMaps().stream()
                    .map(m -> m.getTag().getName())
                    .toList();

            for (String tag : placeTags) {
                matchScore += userPreferences.getOrDefault(tag, 0.0);
            }

            if (matchScore <= 0) {
                matchScore = 0.1;
            }

            long days = 0;
            if (place.getCreatedAt() != null) {
                days = Duration.between(place.getCreatedAt(), now).toDays();
            }
            double timeDecay = Math.exp(-0.05 * Math.max(0, days));
            double finalScore = matchScore * timeDecay;

            scoredPlaces.add(new ScoredPlace(place, finalScore, matchScore));
        }

        List<PlaceSummaryResponse> recommended = scoredPlaces.stream()
                .sorted(Comparator.comparingDouble(ScoredPlace::finalScore).reversed())
                .limit(12)
                .map(sp -> PlaceSummaryResponse.from(sp.place(), false, null))
                .collect(Collectors.toList());

        return new RecommendationResponse(
                "PERSONALIZED_HYBRID",
                primaryMood,
                recommended
        );
    }

    /**
     * 사용자 취향 가중치 벡터 맵을 획득합니다 (Redis 캐시 LookUp 연동).
     */
    private Map<String, Double> getUserPreferenceVector(Long userId) {
        String cacheKey = REDIS_CACHE_KEY_PREFIX + userId;
        try {
            String jsonVal = redisTemplate.opsForValue().get(cacheKey);
            if (jsonVal != null) {
                return objectMapper.readValue(jsonVal, new TypeReference<Map<String, Double>>() {});
            }
        } catch (Exception e) {
            log.warn("[Redis Cache Error] 취향 캐시 로드 실패: {}", e.getMessage());
        }

        Map<String, Double> tagScoreMap = new HashMap<>();

        // 1) 온보딩 관심 태그 (개당 +5.0)
        List<UserPreferenceTag> prefTags = userPreferenceTagRepository.findByUserId(userId);
        for (UserPreferenceTag pt : prefTags) {
            tagScoreMap.merge(pt.getTagName(), 5.0, Double::sum);
        }

        // 2) 상세 조회 이력 (최근 50개, 장소 태그 개당 +1.0)
        List<PlaceViewLog> viewLogs = placeViewLogRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId);
        for (PlaceViewLog vl : viewLogs) {
            if (vl.getPlace() != null) {
                vl.getPlace().getPlaceTagMaps().forEach(m -> 
                    tagScoreMap.merge(m.getTag().getName(), 1.0, Double::sum)
                );
            }
        }

        // 3) 분위기 투표 내역 (장소 태그 개당 +2.0)
        List<VibeVote> votes = vibeVoteRepository.findByUserId(userId);
        for (VibeVote v : votes) {
            if (v.getPlace() != null) {
                v.getPlace().getPlaceTagMaps().forEach(m -> 
                    tagScoreMap.merge(m.getTag().getName(), 2.0, Double::sum)
                );
            }
        }

        // 4) 폴더 스크랩 내역 (장소 태그 개당 +4.0)
        List<Scrap> scraps = scrapRepository.findByUserId(userId);
        for (Scrap s : scraps) {
            if (s.getPlace() != null) {
                s.getPlace().getPlaceTagMaps().forEach(m -> 
                    tagScoreMap.merge(m.getTag().getName(), 4.0, Double::sum)
                );
            }
        }

        if (!tagScoreMap.isEmpty()) {
            try {
                String jsonStr = objectMapper.writeValueAsString(tagScoreMap);
                redisTemplate.opsForValue().set(cacheKey, jsonStr, 1, TimeUnit.HOURS);
            } catch (Exception e) {
                log.warn("[Redis Cache Error] 취향 캐싱 실패: {}", e.getMessage());
            }
        }

        return tagScoreMap;
    }

    private RecommendationResponse getPopularFallback() {
        List<Place> popularPlaces = placeRepository.findAllByIsPublishedTrue(
                PageRequest.of(0, 12, Sort.by(Sort.Direction.DESC, "id"))
        ).getContent();

        List<PlaceSummaryResponse> recommended = popularPlaces.stream()
                .map(place -> PlaceSummaryResponse.from(place, false, null))
                .collect(Collectors.toList());

        return new RecommendationResponse(
                "POPULAR_FALLBACK",
                "요즘 뜨는 취향",
                recommended
        );
    }

    private record ScoredPlace(Place place, double finalScore, double matchScore) {}
}
