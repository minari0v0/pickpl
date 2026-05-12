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

    public PlaceService(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
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
}
