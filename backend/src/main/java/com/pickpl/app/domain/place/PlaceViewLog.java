package com.pickpl.app.domain.place;

import com.pickpl.app.domain.common.BaseTimeEntity;
import com.pickpl.app.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
    name = "place_view_log",
    indexes = {
        @Index(name = "idx_view_created_tag", columnList = "created_at, inflow_tag")
    }
)
public class PlaceViewLog extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "place_view_log_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @Column(name = "inflow_tag", length = 50)
    private String inflowTag;

    public PlaceViewLog(User user, Place place, String inflowTag) {
        this.user = user;
        this.place = place;
        this.inflowTag = inflowTag;
    }
}
