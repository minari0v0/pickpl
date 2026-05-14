package com.pickpl.app.domain.place;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Place 엔티티 데이터 접근 계층.
 */
@Repository
public interface PlaceRepository extends JpaRepository<Place, Long> {

    /** 외부 API ID로 공간 조회 (중복 삽입 방지용) */
    Optional<Place> findByExternalId(String externalId);

    /** 카테고리로 공간 목록 조회 */
    List<Place> findByCategory(String category);

    /**
     * 지정된 모든 태그를 포함하는(교집합) 공간 목록 조회.
     * IN 조건으로 조회 후, 매칭된 태그 개수가 요청한 태그 개수와 일치하는 Place만 필터링합니다.
     */
    @Query("""
            SELECT p FROM Place p
            JOIN p.placeTagMaps ptm
            JOIN ptm.tag t
            WHERE t.name IN :tagNames
            GROUP BY p.id
            HAVING COUNT(DISTINCT t.name) = :tagCount
            """)
    List<Place> findPlacesMatchingAllTags(@org.springframework.data.repository.query.Param("tagNames") List<String> tagNames, @org.springframework.data.repository.query.Param("tagCount") long tagCount);
}
