package com.pickpl.app.vibe.service;

import com.pickpl.app.domain.place.Place;
import com.pickpl.app.domain.place.PlaceRepository;
import com.pickpl.app.domain.vibe.VibeType;
import com.pickpl.app.domain.vibe.VibeVote;
import com.pickpl.app.domain.vibe.VibeVoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class VibeService {

    private final VibeVoteRepository vibeVoteRepository;
    private final PlaceRepository placeRepository;

    public VibeService(VibeVoteRepository vibeVoteRepository, PlaceRepository placeRepository) {
        this.vibeVoteRepository = vibeVoteRepository;
        this.placeRepository = placeRepository;
    }

    public void addVibeVote(Long userId, Long placeId, VibeType vibeType) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공간입니다: " + placeId));

        vibeVoteRepository.findByUserIdAndPlaceId(userId, placeId).ifPresentOrElse(
            existingVote -> {
                if (existingVote.getVibeType() != vibeType) {
                    place.decrementVibeVote(existingVote.getVibeType());
                    existingVote.setVibeType(vibeType);
                    place.incrementVibeVote(vibeType);
                }
            },
            () -> {
                VibeVote vote = new VibeVote(userId, place, vibeType);
                vibeVoteRepository.save(vote);
                place.incrementVibeVote(vibeType);
            }
        );
        // place 엔티티가 영속 상태이므로 자동으로 update 쿼리가 발생합니다.
    }
}
