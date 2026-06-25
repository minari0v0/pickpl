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

    /** 외부 ID 기등록 존재 여부 판단 */
    boolean existsByExternalId(String externalId);

    /** 공개 승인된 전체 장소 목록 조회 */
    List<Place> findAllByIsPublishedTrue();

    /** 공개 승인된 전체 장소 목록 조회 (페이징) */
    org.springframework.data.domain.Page<Place> findAllByIsPublishedTrue(org.springframework.data.domain.Pageable pageable);

    /** 키워드로 공간 목록 조회 (페이징) */
    @Query(value = """
            SELECT p FROM Place p
            WHERE (p.name LIKE CONCAT('%', :keyword, '%') OR p.address LIKE CONCAT('%', :keyword, '%') OR p.category LIKE CONCAT('%', :keyword, '%') OR p.aiMoodSummary LIKE CONCAT('%', :keyword, '%'))
              AND p.isPublished = true
            """,
            countQuery = """
            SELECT COUNT(p) FROM Place p
            WHERE (p.name LIKE CONCAT('%', :keyword, '%') OR p.address LIKE CONCAT('%', :keyword, '%') OR p.category LIKE CONCAT('%', :keyword, '%') OR p.aiMoodSummary LIKE CONCAT('%', :keyword, '%'))
              AND p.isPublished = true
            """)
    org.springframework.data.domain.Page<Place> findPlacesByKeyword(@org.springframework.data.repository.query.Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);

    /**
     * 지정된 모든 태그를 포함하는(교집합) 공간 목록 조회.
     * IN 조건으로 조회 후, 매칭된 태그 개수가 요청한 태그 개수와 일치하는 Place만 필터링합니다.
     */
    @Query("""
            SELECT p FROM Place p
            JOIN p.placeTagMaps ptm
            JOIN ptm.tag t
            WHERE t.name IN :tagNames AND p.isPublished = true
            GROUP BY p.id
            HAVING COUNT(DISTINCT t.name) = :tagCount
            """)
    List<Place> findPlacesMatchingAllTags(@org.springframework.data.repository.query.Param("tagNames") List<String> tagNames, @org.springframework.data.repository.query.Param("tagCount") long tagCount);

    /** 지정된 모든 태그를 포함하는(교집합) 공간 목록 조회 (페이징) */
    @Query(value = """
            SELECT p FROM Place p
            JOIN p.placeTagMaps ptm
            JOIN ptm.tag t
            WHERE t.name IN :tagNames AND p.isPublished = true
            GROUP BY p.id
            HAVING COUNT(DISTINCT t.name) = :tagCount
            """,
            countQuery = """
            SELECT COUNT(p) FROM Place p
            WHERE p.id IN (
                SELECT ptm.place.id FROM PlaceTagMap ptm
                JOIN ptm.tag t
                WHERE t.name IN :tagNames AND ptm.place.isPublished = true
                GROUP BY ptm.place.id
                HAVING COUNT(DISTINCT t.name) = :tagCount
            )
            """)
    org.springframework.data.domain.Page<Place> findPlacesMatchingAllTags(
            @org.springframework.data.repository.query.Param("tagNames") List<String> tagNames,
            @org.springframework.data.repository.query.Param("tagCount") long tagCount,
            org.springframework.data.domain.Pageable pageable);

    /** 태그 교집합 및 키워드 매칭 공간 목록 조회 (페이징) */
    @Query(value = """
            SELECT p FROM Place p
            JOIN p.placeTagMaps ptm
            JOIN ptm.tag t
            WHERE t.name IN :tagNames
              AND (p.name LIKE CONCAT('%', :keyword, '%') OR p.address LIKE CONCAT('%', :keyword, '%') OR p.category LIKE CONCAT('%', :keyword, '%') OR p.aiMoodSummary LIKE CONCAT('%', :keyword, '%'))
              AND p.isPublished = true
            GROUP BY p.id
            HAVING COUNT(DISTINCT t.name) = :tagCount
            """,
            countQuery = """
            SELECT COUNT(p) FROM Place p
            WHERE p.id IN (
                SELECT ptm.place.id FROM PlaceTagMap ptm
                JOIN ptm.tag t
                WHERE t.name IN :tagNames AND ptm.place.isPublished = true
                  AND (ptm.place.name LIKE CONCAT('%', :keyword, '%') OR ptm.place.address LIKE CONCAT('%', :keyword, '%') OR ptm.place.category LIKE CONCAT('%', :keyword, '%') OR ptm.place.aiMoodSummary LIKE CONCAT('%', :keyword, '%'))
                GROUP BY ptm.place.id
                HAVING COUNT(DISTINCT t.name) = :tagCount
            )
            """)
    org.springframework.data.domain.Page<Place> findPlacesMatchingAllTagsAndKeyword(
            @org.springframework.data.repository.query.Param("tagNames") List<String> tagNames,
            @org.springframework.data.repository.query.Param("tagCount") long tagCount,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            org.springframework.data.domain.Pageable pageable);

    /** 큐레이션 테마명으로 공개된 공간 목록 조회 */
    List<Place> findAllByCurationThemeAndIsPublishedTrue(String curationTheme);
}
