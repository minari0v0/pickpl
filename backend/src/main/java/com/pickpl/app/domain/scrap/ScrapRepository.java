package com.pickpl.app.domain.scrap;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Scrap 엔티티 데이터 접근 계층.
 */
@Repository
public interface ScrapRepository extends JpaRepository<Scrap, Long> {

    /** 특정 유저의 전체 스크랩 목록 조회 */
    List<Scrap> findByUserId(Long userId);

    /** 특정 유저가 특정 공간을 스크랩했는지 조회 (중복 체크용) */
    Optional<Scrap> findByUserIdAndPlaceId(Long userId, Long placeId);

    /** 특정 유저가 특정 공간을 스크랩했는지 여부 */
    boolean existsByUserIdAndPlaceId(Long userId, Long placeId);
}
