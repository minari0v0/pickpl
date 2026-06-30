package com.pickpl.app.domain.tag;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Tag 엔티티 데이터 접근 계층.
 */
@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    /**
     * 이름과 유형으로 태그 조회.
     * Tag에는 (name, type) 복합 유니크 제약이 있으므로, 이 메서드로 중복 삽입을 방지합니다.
     */
    Optional<Tag> findByNameAndType(String name, TagType type);

    interface TagStatsDto {
        String getTagName();
        Long getCountValue();
    }

    @Query("""
        SELECT t.name as tagName, COUNT(s) as countValue 
        FROM Scrap s 
        JOIN s.place p 
        JOIN p.placeTagMaps ptm 
        JOIN ptm.tag t 
        GROUP BY t.name
    """)
    List<TagStatsDto> findTagScrapCounts();

    @Query("""
        SELECT t.name as tagName, COUNT(v) as countValue 
        FROM VibeVote v 
        JOIN v.place p 
        JOIN p.placeTagMaps ptm 
        JOIN ptm.tag t 
        GROUP BY t.name
    """)
    List<TagStatsDto> findTagVibeVoteCounts();
}
