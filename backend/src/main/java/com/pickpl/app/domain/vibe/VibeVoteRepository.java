package com.pickpl.app.domain.vibe;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface VibeVoteRepository extends JpaRepository<VibeVote, Long> {
    boolean existsByUserIdAndPlaceId(Long userId, Long placeId);
    Optional<VibeVote> findByUserIdAndPlaceId(Long userId, Long placeId);
    List<VibeVote> findByUserId(Long userId);
    void deleteByPlaceId(Long placeId);
    void deleteByPlaceIdIn(List<Long> placeIds);
    void deleteByUserId(Long userId);
}
