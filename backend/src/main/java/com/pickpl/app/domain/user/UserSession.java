package com.pickpl.app.domain.user;

import com.pickpl.app.domain.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "user_sessions")
public class UserSession extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_session_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "refresh_token_uuid", nullable = false, unique = true)
    private String refreshTokenUuid;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "location")
    private String location;

    @Column(name = "device")
    private String device;

    @Column(name = "browser")
    private String browser;

    @Column(name = "last_accessed_at", nullable = false)
    private LocalDateTime lastAccessedAt;

    @Builder
    public UserSession(User user, String refreshTokenUuid, String ipAddress, String location, String device, String browser, LocalDateTime lastAccessedAt) {
        this.user = user;
        this.refreshTokenUuid = refreshTokenUuid;
        this.ipAddress = ipAddress;
        this.location = location;
        this.device = device;
        this.browser = browser;
        this.lastAccessedAt = lastAccessedAt != null ? lastAccessedAt : LocalDateTime.now();
    }

    public void updateAccessTime(LocalDateTime time, String refreshTokenUuid) {
        this.lastAccessedAt = time;
        if (refreshTokenUuid != null) {
            this.refreshTokenUuid = refreshTokenUuid;
        }
    }
}
