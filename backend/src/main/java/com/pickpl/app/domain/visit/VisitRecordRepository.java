package com.pickpl.app.domain.visit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VisitRecordRepository extends JpaRepository<VisitRecord, Long> {
    List<VisitRecord> findByPlaceIdOrderByVisitedDateDesc(Long placeId);
    List<VisitRecord> findByUserIdOrderByVisitedDateDesc(Long userId);
    Page<VisitRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);
    void deleteByPlaceId(Long placeId);
    void deleteByUserId(Long userId);
}
