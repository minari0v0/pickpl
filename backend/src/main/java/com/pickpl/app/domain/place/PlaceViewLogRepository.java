package com.pickpl.app.domain.place;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlaceViewLogRepository extends JpaRepository<PlaceViewLog, Long> {
    List<PlaceViewLog> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
}
