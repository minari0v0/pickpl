package com.pickpl.app.scrap.service;

import com.pickpl.app.domain.place.Place;
import com.pickpl.app.domain.place.PlaceRepository;
import com.pickpl.app.domain.scrap.Scrap;
import com.pickpl.app.domain.scrap.ScrapRepository;
import com.pickpl.app.domain.vibe.VibeVoteRepository;
import com.pickpl.app.place.dto.PlaceSummaryResponse;
import com.pickpl.app.scrap.dto.ScrapResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ScrapService {

    private final ScrapRepository scrapRepository;
    private final PlaceRepository placeRepository;
    private final VibeVoteRepository vibeVoteRepository;

    public ScrapService(ScrapRepository scrapRepository, PlaceRepository placeRepository, VibeVoteRepository vibeVoteRepository) {
        this.scrapRepository = scrapRepository;
        this.placeRepository = placeRepository;
        this.vibeVoteRepository = vibeVoteRepository;
    }

    /**
     * 특정 유저의 전체 스크랩 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ScrapResponse> getUserScraps(Long userId) {
        List<Scrap> scraps = scrapRepository.findByUserId(userId);

        // 유저가 분위기 투표한 장소 정보 매핑
        Map<Long, String> vibeVotesMap = vibeVoteRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(
                        vote -> vote.getPlace().getId(),
                        vote -> vote.getVibeType().name(),
                        (existing, replacement) -> existing
                ));

        return scraps.stream()
                .map(scrap -> {
                    Place place = scrap.getPlace();
                    PlaceSummaryResponse placeSummary = PlaceSummaryResponse.from(
                            place,
                            true,
                            vibeVotesMap.get(place.getId())
                    );
                    return new ScrapResponse(scrap.getId(), scrap.getFolderName(), placeSummary);
                })
                .toList();
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

    /**
     * 스크랩 폴더 이름 변경
     */
    @Transactional
    public void renameFolder(Long userId, String oldFolderName, String newFolderName) {
        if (oldFolderName == null || oldFolderName.isBlank() || newFolderName == null || newFolderName.isBlank()) {
            throw new IllegalArgumentException("폴더 이름이 비어있습니다.");
        }
        scrapRepository.renameFolder(userId, oldFolderName, newFolderName);
    }

    /**
     * 스크랩 폴더 삭제 (폴더 내의 모든 스크랩 삭제)
     */
    @Transactional
    public void deleteFolder(Long userId, String folderName) {
        if (folderName == null || folderName.isBlank()) {
            throw new IllegalArgumentException("폴더 이름이 비어있습니다.");
        }
        scrapRepository.deleteFolder(userId, folderName);
    }
}

