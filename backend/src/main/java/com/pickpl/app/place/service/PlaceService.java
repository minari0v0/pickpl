package com.pickpl.app.place.service;

import com.pickpl.app.domain.place.PlaceRepository;
import com.pickpl.app.place.dto.PlaceSummaryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Place 비즈니스 로직 서비스.
 */
@Service
@Transactional(readOnly = true)
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final com.pickpl.app.domain.tag.TagRepository tagRepository;

    public PlaceService(PlaceRepository placeRepository, com.pickpl.app.domain.tag.TagRepository tagRepository) {
        this.placeRepository = placeRepository;
        this.tagRepository = tagRepository;
    }

    /**
     * 전체 공간 목록을 조회하여 DTO 리스트로 반환합니다.
     * PlaceTagMap → Tag 컬렉션을 DTO 변환 시점에 접근하므로,
     * 트랜잭션 내에서 LAZY 로딩이 정상 동작합니다.
     */
    public List<PlaceSummaryResponse> findAllPlaces() {
        return placeRepository.findAll().stream()
                .map(PlaceSummaryResponse::from)
                .toList();
    }

    /**
     * 특정 태그 리스트를 모두 포함하는 공간 목록을 반환합니다.
     */
    /**
     * 특정 태그 리스트를 모두 포함하는 공간 목록을 반환합니다.
     */
    public List<PlaceSummaryResponse> findPlacesByTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return findAllPlaces();
        }
        return placeRepository.findPlacesMatchingAllTags(tags, tags.size()).stream()
                .map(PlaceSummaryResponse::from)
                .toList();
    }

    /**
     * ID로 단건 공간 상세 조회.
     */
    public com.pickpl.app.place.dto.PlaceDetailResponse findPlaceById(Long id) {
        return placeRepository.findById(id)
                .map(com.pickpl.app.place.dto.PlaceDetailResponse::from)
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

            // 태그 처리
            if (data.tags() != null) {
                for (String tagName : data.tags()) {
                    com.pickpl.app.domain.tag.Tag tag = tagRepository.findByNameAndType(tagName, com.pickpl.app.domain.tag.TagType.MOOD)
                            .orElseGet(() -> tagRepository.save(new com.pickpl.app.domain.tag.Tag(tagName, com.pickpl.app.domain.tag.TagType.MOOD)));
                    place.addTag(tag);
                }
            }

            placeRepository.save(place);
            count++;
        }
        return count;
    }
}
