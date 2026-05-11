package com.example.demo.domain.scrap;

import com.example.demo.domain.common.BaseTimeEntity;
import com.example.demo.domain.place.Place;
import jakarta.persistence.*;

/**
 * 개인 컬렉션 보드(스크랩/하트) 엔티티.
 *
 * 유저가 피드에서 '하트' 버튼을 누르면 생성됩니다.
 * - 현재 단계에서는 User 엔티티가 없으므로 userId (Long)로 유저를 식별합니다.
 * - User 엔티티 구현 이후 @ManyToOne 연관관계로 교체 예정.
 *
 * 비즈니스 규칙:
 *  - 동일 유저가 동일 공간을 중복 스크랩할 수 없습니다. (UK 제약)
 *  - 스크랩 삭제 시 Place 데이터는 보존됩니다. (cascade 없음)
 */
@Entity
@Table(name = "scrap",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_place_scrap",
                columnNames = {"user_id", "place_id"}
        ))
public class Scrap extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scrap_id")
    private Long id;

    /**
     * 스크랩한 유저 ID.
     * User 엔티티 완성 전 임시로 Long 타입 FK를 직접 관리합니다.
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 스크랩된 공간.
     * 공간이 삭제되면 스크랩도 함께 삭제됩니다. (Place.scraps cascade 처리)
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    // --- 생성자 ---

    protected Scrap() {}

    public Scrap(Long userId, Place place) {
        this.userId = userId;
        this.place = place;
    }

    // --- 연관관계 편의 메서드 ---

    /**
     * 팩토리 메서드: Scrap 생성과 동시에 Place 컬렉션에 자신을 등록합니다.
     * 양방향 일관성을 보장합니다.
     */
    public static Scrap of(Long userId, Place place) {
        Scrap scrap = new Scrap(userId, place);
        place.getScraps().add(scrap);
        return scrap;
    }

    // --- Getters ---

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Place getPlace() { return place; }
}
