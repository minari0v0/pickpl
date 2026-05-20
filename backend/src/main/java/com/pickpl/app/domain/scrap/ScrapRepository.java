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

    /** 특정 유저가 스크랩한 모든 공간의 ID 목록 조회 */
    @org.springframework.data.jpa.repository.Query("SELECT s.place.id FROM Scrap s WHERE s.userId = :userId")
    List<Long> findScrappedPlaceIdsByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Scrap s SET s.folderName = :newFolderName WHERE s.userId = :userId AND s.folderName = :oldFolderName")
    void renameFolder(@org.springframework.data.repository.query.Param("userId") Long userId, 
                      @org.springframework.data.repository.query.Param("oldFolderName") String oldFolderName, 
                      @org.springframework.data.repository.query.Param("newFolderName") String newFolderName);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Scrap s WHERE s.userId = :userId AND s.folderName = :folderName")
    void deleteFolder(@org.springframework.data.repository.query.Param("userId") Long userId, 
                      @org.springframework.data.repository.query.Param("folderName") String folderName);
}
