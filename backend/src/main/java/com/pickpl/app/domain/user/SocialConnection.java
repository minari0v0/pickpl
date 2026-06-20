package com.pickpl.app.domain.user;

import com.pickpl.app.domain.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "social_connection", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"provider", "provider_id"})
})
public class SocialConnection extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "social_connection_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String provider; // NAVER, KAKAO, GOOGLE

    @Column(name = "provider_id", nullable = false)
    private String providerId;

    @Builder
    public SocialConnection(User user, String provider, String providerId) {
        this.user = user;
        this.provider = provider;
        this.providerId = providerId;
    }
}
