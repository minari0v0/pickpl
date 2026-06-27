package com.pickpl.app.domain.visit;

import com.pickpl.app.domain.common.BaseTimeEntity;
import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * 장소 방문 기록(체크인/한줄평) 엔티티.
 *
 * 장소 데이터의 수정/삭제가 빈번한 수집 파이프라인의 특성을 고려하여,
 * 물리적 FK 제약을 제거하고 placeId를 직접 관리하는 논리적 FK 아키텍처를 채택합니다.
 */
@Entity
@Table(name = "visit_record", indexes = {
        @Index(name = "idx_visit_place", columnList = "place_id"),
        @Index(name = "idx_visit_user", columnList = "user_id")
})
public class VisitRecord extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "visit_record_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "place_id", nullable = false)
    private Long placeId;

    @Column(name = "comment", nullable = false, length = 1000)
    private String comment;

    @Column(name = "visited_date", nullable = false)
    private LocalDate visitedDate;

    protected VisitRecord() {}

    public VisitRecord(Long userId, Long placeId, String comment, LocalDate visitedDate) {
        this.userId = userId;
        this.placeId = placeId;
        this.comment = comment;
        this.visitedDate = visitedDate;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getPlaceId() {
        return placeId;
    }

    public String getComment() {
        return comment;
    }

    public LocalDate getVisitedDate() {
        return visitedDate;
    }

    public void update(String comment, LocalDate visitedDate) {
        this.comment = comment;
        this.visitedDate = visitedDate;
    }
}
