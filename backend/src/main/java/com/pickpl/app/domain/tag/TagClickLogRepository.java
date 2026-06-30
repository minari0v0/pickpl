package com.pickpl.app.domain.tag;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TagClickLogRepository extends JpaRepository<TagClickLog, Long> {

    interface PopularMoodDto {
        String getTagName();
        Long getClickCount();
    }

    /**
     * 지정한 시간(최근 24시간 등) 이후로 클릭 횟수가 가장 높은 태그 리스트를 집계합니다.
     */
    @Query("""
        SELECT t.tagName as tagName, COUNT(t) as clickCount 
        FROM TagClickLog t 
        WHERE t.createdAt >= :since 
        GROUP BY t.tagName 
        ORDER BY COUNT(t) DESC
    """)
    List<PopularMoodDto> findTopMoodsInLast24Hours(@Param("since") LocalDateTime since);

    /**
     * 특정 태그의 전체 누적 클릭 횟수를 카운트합니다.
     */
    long countByTagName(String tagName);
}
