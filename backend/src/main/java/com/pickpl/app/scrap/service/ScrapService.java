package com.pickpl.app.scrap.service;

import com.pickpl.app.domain.place.Place;
import com.pickpl.app.domain.place.PlaceRepository;
import com.pickpl.app.domain.scrap.Scrap;
import com.pickpl.app.domain.scrap.ScrapRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ScrapService {

    private final ScrapRepository scrapRepository;
    private final PlaceRepository placeRepository;

    public ScrapService(ScrapRepository scrapRepository, PlaceRepository placeRepository) {
        this.scrapRepository = scrapRepository;
        this.placeRepository = placeRepository;
    }

    /**
     * 장소 스크랩 토글. 이미 존재하면 삭제, 없으면 생성.
     * @return true if created, false if deleted
     */
    public boolean toggleScrap(Long userId, Long placeId) {
        return scrapRepository.findByUserIdAndPlaceId(userId, placeId)
                .map(scrap -> {
                    scrapRepository.delete(scrap);
                    return false;
                })
                .orElseGet(() -> {
                    Place place = placeRepository.findById(placeId)
                            .orElseThrow(() -> new IllegalArgumentException("Place not found"));
                    scrapRepository.save(Scrap.of(userId, place));
                    return true;
                });
    }
}
