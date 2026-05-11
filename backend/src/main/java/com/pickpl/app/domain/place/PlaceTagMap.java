package com.example.demo.domain.place;

import com.example.demo.domain.tag.Tag;
import jakarta.persistence.*;

/**
 * Place ↔ Tag 다대다(N:M) 연관관계를 표현하는 중간 매핑 엔티티.
 *
 * 단순 @ManyToMany 대신 명시적 중간 테이블 엔티티를 사용하는 이유:
 *  1. 향후 AI 신뢰도(confidence), 태그 등록 경로 등의 컬럼 추가가 용이합니다.
 *  2. 쿼리 및 지연 로딩 전략 제어가 명확해집니다.
 *  3. JPA의 @ManyToMany 사용 시 발생하는 cascade 문제를 방지합니다.
 */
@Entity
@Table(name = "place_tag_map",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_place_tag",
                columnNames = {"place_id", "tag_id"}
        ))
public class PlaceTagMap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "place_tag_map_id")
    private Long id;

    /**
     * 연관된 공간.
     * 연관관계 주인입니다.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    /**
     * 연관된 태그.
     * 연관관계 주인입니다.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    /**
     * AI 태깅 신뢰도 점수 (0.0 ~ 1.0).
     * Gemini API 응답에서 추출하며, 미제공 시 null 허용.
     * 향후 태그 정확도 지표(KPI) 측정에 활용됩니다.
     */
    @Column(name = "confidence_score")
    private Double confidenceScore;

    // --- 생성자 ---

    protected PlaceTagMap() {}

    public PlaceTagMap(Place place, Tag tag) {
        this.place = place;
        this.tag = tag;
    }

    public PlaceTagMap(Place place, Tag tag, Double confidenceScore) {
        this.place = place;
        this.tag = tag;
        this.confidenceScore = confidenceScore;
    }

    // --- Getters ---

    public Long getId() { return id; }
    public Place getPlace() { return place; }
    public Tag getTag() { return tag; }
    public Double getConfidenceScore() { return confidenceScore; }

    // --- Setter ---

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }
}
