package com.pickpl.app.place.service;

import com.pickpl.app.domain.place.PlaceRepository;
import com.pickpl.app.place.dto.PlaceSummaryResponse;
import com.pickpl.app.domain.scrap.ScrapRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.HashSet;

/**
 * Place 비즈니스 로직 서비스.
 */
@Service
@Transactional(readOnly = true)
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final com.pickpl.app.domain.tag.TagRepository tagRepository;
    private final ScrapRepository scrapRepository;
    private final com.pickpl.app.domain.vibe.VibeVoteRepository vibeVoteRepository;

    public PlaceService(PlaceRepository placeRepository, com.pickpl.app.domain.tag.TagRepository tagRepository, ScrapRepository scrapRepository, com.pickpl.app.domain.vibe.VibeVoteRepository vibeVoteRepository) {
        this.placeRepository = placeRepository;
        this.tagRepository = tagRepository;
        this.scrapRepository = scrapRepository;
        this.vibeVoteRepository = vibeVoteRepository;
    }

    private Set<Long> getScrappedPlaceIds(Long userId) {
        if (userId == null) return new HashSet<>();
        return new HashSet<>(scrapRepository.findScrappedPlaceIdsByUserId(userId));
    }

    private java.util.Map<Long, String> getVibeVotesMap(Long userId) {
        if (userId == null) return new java.util.HashMap<>();
        return vibeVoteRepository.findByUserId(userId).stream()
                .collect(java.util.stream.Collectors.toMap(
                        vote -> vote.getPlace().getId(),
                        vote -> vote.getVibeType().name()
                ));
    }

    /**
     * 전체 공간 목록을 조회하여 DTO 리스트로 반환합니다.
     */
    public List<PlaceSummaryResponse> findAllPlaces(Long userId) {
        Set<Long> scrappedIds = getScrappedPlaceIds(userId);
        java.util.Map<Long, String> vibeVotesMap = getVibeVotesMap(userId);
        return placeRepository.findAll().stream()
                .map(place -> PlaceSummaryResponse.from(place, scrappedIds.contains(place.getId()), vibeVotesMap.get(place.getId())))
                .toList();
    }

    /**
     * 특정 태그 리스트를 모두 포함하는 공간 목록을 반환합니다.
     */
    public List<PlaceSummaryResponse> findPlacesByTags(List<String> tags, Long userId) {
        if (tags == null || tags.isEmpty()) {
            return findAllPlaces(userId);
        }
        Set<Long> scrappedIds = getScrappedPlaceIds(userId);
        java.util.Map<Long, String> vibeVotesMap = getVibeVotesMap(userId);
        return placeRepository.findPlacesMatchingAllTags(tags, tags.size()).stream()
                .map(place -> PlaceSummaryResponse.from(place, scrappedIds.contains(place.getId()), vibeVotesMap.get(place.getId())))
                .toList();
    }

    /**
     * ID로 단건 공간 상세 조회.
     */
    public com.pickpl.app.place.dto.PlaceDetailResponse findPlaceById(Long id, Long userId) {
        boolean isScrapped = userId != null && scrapRepository.existsByUserIdAndPlaceId(userId, id);
        String userVotedVibe = userId != null ? vibeVoteRepository.findByUserIdAndPlaceId(userId, id)
                .map(vote -> vote.getVibeType().name()).orElse(null) : null;
        return placeRepository.findById(id)
                .map(place -> com.pickpl.app.place.dto.PlaceDetailResponse.from(place, isScrapped, userVotedVibe))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공간입니다: " + id));
    }

    /**
     * Python 크롤러가 전송한 장소 데이터를 일괄 저장합니다.
     */
    @Transactional
    public int saveBatch(com.pickpl.app.place.dto.PlaceBatchRequest request) {
        int count = 0;
        for (com.pickpl.app.place.dto.PlaceBatchRequest.PlaceData data : request.places()) {
            // 이미 존재하는 장소(externalId 기준)는 건너뛰거나 업데이트 (여기선 건너뜀)
            if (placeRepository.findByExternalId(data.externalId()).isPresent()) {
                continue;
            }

            com.pickpl.app.domain.place.Place place = new com.pickpl.app.domain.place.Place(
                    data.name(),
                    data.thumbnailUrl() != null ? data.thumbnailUrl() : "",
                    data.externalId(),
                    data.address(),
                    data.latitude(),
                    data.longitude(),
                    data.category()
            );
            place.setImageUrls(data.imageUrls());
            place.setAiMoodSummary(data.aiMoodSummary());

            placeRepository.save(place);

            // 태그 처리
            if (data.tags() != null) {
                for (String tagName : data.tags()) {
                    com.pickpl.app.domain.tag.Tag tag = tagRepository.findByNameAndType(tagName, com.pickpl.app.domain.tag.TagType.MOOD)
                            .orElseGet(() -> tagRepository.save(new com.pickpl.app.domain.tag.Tag(tagName, com.pickpl.app.domain.tag.TagType.MOOD)));
                    place.addTag(tag);
                }
            }

            count++;
        }
        return count;
    }
}
