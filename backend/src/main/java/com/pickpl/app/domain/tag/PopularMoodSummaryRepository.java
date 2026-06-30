package com.pickpl.app.domain.tag;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PopularMoodSummaryRepository extends JpaRepository<PopularMoodSummary, Integer> {

    List<PopularMoodSummary> findAllByOrderByRankingAsc();

    @Modifying
    @Query(value = "TRUNCATE TABLE popular_mood_summary", nativeQuery = true)
    void truncateTable();
}
