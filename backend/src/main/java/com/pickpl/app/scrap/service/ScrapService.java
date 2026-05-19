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
     * 장소 스크랩 추가
     */
    public void addScrap(Long userId, Long placeId, String folderName) {
        if (scrapRepository.findByUserIdAndPlaceId(userId, placeId).isPresent()) {
            throw new IllegalStateException("이미 스크랩한 공간입니다.");
        }
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공간입니다."));
        scrapRepository.save(Scrap.of(userId, place, folderName));
    }

    /**
     * 장소 스크랩 취소
     */
    public void removeScrap(Long userId, Long placeId) {
        Scrap scrap = scrapRepository.findByUserIdAndPlaceId(userId, placeId)
                .orElseThrow(() -> new IllegalStateException("스크랩되어 있지 않은 공간입니다."));
        scrapRepository.delete(scrap);
    }
}
