package com.pickpl.app.domain.place;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * PlaceTagMap 엔티티 데이터 접근 계층.
 */
@Repository
public interface PlaceTagMapRepository extends JpaRepository<PlaceTagMap, Long> {

    /** 특정 공간에 연결된 모든 태그 매핑 조회 */
    List<PlaceTagMap> findByPlaceId(Long placeId);

    /** 특정 태그에 연결된 모든 공간 매핑 조회 */
    List<PlaceTagMap> findByTagId(Long tagId);

    /** 특정 공간에 연결된 모든 태그 매핑 벌크 삭제 */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from PlaceTagMap p where p.place.id = :placeId")
    void deleteByPlaceId(@org.springframework.data.repository.query.Param("placeId") Long placeId);
}
