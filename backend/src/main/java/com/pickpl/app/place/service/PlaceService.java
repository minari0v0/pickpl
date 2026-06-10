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
    private final jakarta.persistence.EntityManager entityManager;

    private static final java.util.List<String> FACILITY_TAGS = java.util.List.of(
            "콘센트석", "노트북하기좋은", "화장실깨끗", "반려동물동반", "주차가능", "단체석", "와이파이"
    );

    private static final java.util.List<String> WEATHER_TAGS = java.util.List.of(
            "비오는날", "야외테라스", "루프탑"
    );

    public PlaceService(PlaceRepository placeRepository, com.pickpl.app.domain.tag.TagRepository tagRepository, ScrapRepository scrapRepository, com.pickpl.app.domain.vibe.VibeVoteRepository vibeVoteRepository, jakarta.persistence.EntityManager entityManager) {
        this.placeRepository = placeRepository;
        this.tagRepository = tagRepository;
        this.scrapRepository = scrapRepository;
        this.vibeVoteRepository = vibeVoteRepository;
        this.entityManager = entityManager;
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
        return placeRepository.findAllByIsPublishedTrue().stream()
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
            place.setSubCategory(data.subCategory());
            place.setPublished(true);

            placeRepository.save(place);

            // 태그 처리
            if (data.tags() != null) {
                for (String tagName : data.tags()) {
                    com.pickpl.app.domain.tag.TagType type = com.pickpl.app.domain.tag.TagType.MOOD;
                    if (FACILITY_TAGS.contains(tagName)) {
                        type = com.pickpl.app.domain.tag.TagType.FACILITY;
                    } else if (WEATHER_TAGS.contains(tagName)) {
                        type = com.pickpl.app.domain.tag.TagType.WEATHER;
                    }
                    
                    final com.pickpl.app.domain.tag.TagType finalType = type;
                    com.pickpl.app.domain.tag.Tag tag = tagRepository.findByNameAndType(tagName, finalType)
                            .orElseGet(() -> tagRepository.save(new com.pickpl.app.domain.tag.Tag(tagName, finalType)));
                    place.addTag(tag);
                }
            }

            count++;
        }
        return count;
    }

    /**
     * 어드민 패널에서 편집 검수가 끝난 장소 리스트를 일괄 저장 또는 업데이트(Upsert)합니다.
     */
    @Transactional
    public int publishBatch(com.pickpl.app.place.dto.AdminPlacePublishRequest request) {
        int count = 0;
        for (com.pickpl.app.place.dto.AdminPlacePublishRequest.PlacePublishData data : request.places()) {
            java.util.Optional<com.pickpl.app.domain.place.Place> existingPlaceOpt = placeRepository.findByExternalId(data.externalId());

            if (existingPlaceOpt.isPresent()) {
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
            place.setEditorsComment(data.editorsComment());
            place.setSubCategory(data.subCategory());
            place.setPublished(true);

            placeRepository.save(place);

            // Delta 방식으로 태그 갱신
            List<String> newTagNames = data.tags() != null ? data.tags() : java.util.Collections.emptyList();
            List<com.pickpl.app.domain.tag.Tag> currentTags = place.getPlaceTagMaps().stream()
                    .map(com.pickpl.app.domain.place.PlaceTagMap::getTag)
                    .toList();

            List<com.pickpl.app.domain.tag.Tag> tagsToRemove = currentTags.stream()
                    .filter(tag -> !newTagNames.contains(tag.getName()))
                    .toList();

            List<String> tagsToAdd = newTagNames.stream()
                    .filter(name -> currentTags.stream().noneMatch(ct -> ct.getName().equals(name)))
                    .toList();

            for (com.pickpl.app.domain.tag.Tag t : tagsToRemove) {
                place.removeTag(t);
            }

            for (String tagName : tagsToAdd) {
                com.pickpl.app.domain.tag.TagType type = com.pickpl.app.domain.tag.TagType.MOOD;
                if (FACILITY_TAGS.contains(tagName)) {
                    type = com.pickpl.app.domain.tag.TagType.FACILITY;
                } else if (WEATHER_TAGS.contains(tagName)) {
                    type = com.pickpl.app.domain.tag.TagType.WEATHER;
                }
                
                final com.pickpl.app.domain.tag.TagType finalType = type;
                com.pickpl.app.domain.tag.Tag tag = tagRepository.findByNameAndType(tagName, finalType)
                        .orElseGet(() -> tagRepository.save(new com.pickpl.app.domain.tag.Tag(tagName, finalType)));
                place.addTag(tag);
            }

            count++;
        }
        return count;
    }

    /**
     * 어드민용 전체 공간 목록 조회 (공개/비공개 상관없이 전체 반환).
     */
    public List<PlaceSummaryResponse> findAllPlacesForAdmin() {
        return placeRepository.findAll().stream()
                .map(place -> PlaceSummaryResponse.from(place, false, null))
                .toList();
    }

    /**
     * 어드민용 단건 공간 정보 수정.
     */
    @Transactional
    public void updatePlace(Long id, com.pickpl.app.place.dto.AdminPlacePublishRequest.PlacePublishData data) {
        com.pickpl.app.domain.place.Place place = placeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공간입니다: " + id));

        place.setEditorsComment(data.editorsComment());
        place.setPublished(data.isPublished());
        place.setAiMoodSummary(data.aiMoodSummary());
        place.setImageUrls(data.imageUrls());
        place.setSubCategory(data.subCategory());
        
        // Delta 방식으로 태그 갱신
        List<String> newTagNames = data.tags() != null ? data.tags() : java.util.Collections.emptyList();
        List<com.pickpl.app.domain.tag.Tag> currentTags = place.getPlaceTagMaps().stream()
                .map(com.pickpl.app.domain.place.PlaceTagMap::getTag)
                .toList();

        List<com.pickpl.app.domain.tag.Tag> tagsToRemove = currentTags.stream()
                .filter(tag -> !newTagNames.contains(tag.getName()))
                .toList();

        List<String> tagsToAdd = newTagNames.stream()
                .filter(name -> currentTags.stream().noneMatch(ct -> ct.getName().equals(name)))
                .toList();

        for (com.pickpl.app.domain.tag.Tag t : tagsToRemove) {
            place.removeTag(t);
        }

        for (String tagName : tagsToAdd) {
            com.pickpl.app.domain.tag.TagType type = com.pickpl.app.domain.tag.TagType.MOOD;
            if (FACILITY_TAGS.contains(tagName)) {
                type = com.pickpl.app.domain.tag.TagType.FACILITY;
            } else if (WEATHER_TAGS.contains(tagName)) {
                type = com.pickpl.app.domain.tag.TagType.WEATHER;
            }
            
            final com.pickpl.app.domain.tag.TagType finalType = type;
            com.pickpl.app.domain.tag.Tag tag = tagRepository.findByNameAndType(tagName, finalType)
                    .orElseGet(() -> tagRepository.save(new com.pickpl.app.domain.tag.Tag(tagName, finalType)));
            place.addTag(tag);
        }
        placeRepository.save(place);
    }

    /**
     * 어드민용 단건 공간 삭제.
     */
    @Transactional
    public void deletePlace(Long id) {
        if (!placeRepository.existsById(id)) {
            throw new IllegalArgumentException("존재하지 않는 공간입니다: " + id);
        }
        placeRepository.deleteById(id);
    }

    /**
     * 어드민용 전체 비공개 장소 일괄 공개 처리.
     */
    @Transactional
    public int publishAllPlaces() {
        List<com.pickpl.app.domain.place.Place> places = placeRepository.findAll();
        int count = 0;
        for (com.pickpl.app.domain.place.Place place : places) {
            if (!place.isPublished()) {
                place.setPublished(true);
                placeRepository.save(place);
                count++;
            }
        }
        return count;
    }

    /**
     * 어드민용 선택한 장소들 공개 상태 일괄 변경.
     */
    @Transactional
    public int updatePublishStatusBulk(List<Long> ids, boolean isPublished) {
        if (ids == null || ids.isEmpty()) return 0;
        List<com.pickpl.app.domain.place.Place> places = placeRepository.findAllById(ids);
        for (com.pickpl.app.domain.place.Place place : places) {
            place.setPublished(isPublished);
            placeRepository.save(place);
        }
        return places.size();
    }
}

