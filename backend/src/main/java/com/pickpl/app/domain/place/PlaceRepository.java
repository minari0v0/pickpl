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
     * 태그 이름으로 연결된 공간 목록 조회 (N+1 방지용 fetch join).
     * PlaceTagMap → Tag 경로를 통해 태그명이 일치하는 Place를 반환합니다.
     */
    @Query("""
            SELECT DISTINCT p FROM Place p
            JOIN p.placeTagMaps ptm
            JOIN ptm.tag t
            WHERE t.name = :tagName
            """)
    List<Place> findByTagName(String tagName);
}
