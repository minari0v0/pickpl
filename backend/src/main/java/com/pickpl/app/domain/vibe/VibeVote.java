package com.pickpl.app.domain.vibe;

import com.pickpl.app.domain.common.BaseTimeEntity;
import com.pickpl.app.domain.place.Place;
import jakarta.persistence.*;

/**
 * 공간 분위기 투표 내역 엔티티.
 */
@Entity
@Table(name = "vibe_vote", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "place_id"})
})
public class VibeVote extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vibe_vote_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @Enumerated(EnumType.STRING)
    @Column(name = "vibe_type", nullable = false)
    private VibeType vibeType;

    protected VibeVote() {}

    public VibeVote(Long userId, Place place, VibeType vibeType) {
        this.userId = userId;
        this.place = place;
        this.vibeType = vibeType;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Place getPlace() { return place; }
    public VibeType getVibeType() { return vibeType; }

    public void setVibeType(VibeType vibeType) { this.vibeType = vibeType; }
}
