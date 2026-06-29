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
@Table(name = "users")
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String password; // Nullable for purely social logins

    @Column(nullable = false)
    private String nickname;

    @Column
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider provider;

    @Column
    private String providerId; // ID from OAuth provider (Google sub, Kakao id, etc.)

    @Column(nullable = false)
    private boolean emailVerified = false;

    @Column(nullable = false)
    private boolean onboarded = false;

    @Builder
    public User(String email, String password, String nickname, String profileImageUrl, Role role, AuthProvider provider, String providerId, Boolean emailVerified, Boolean onboarded) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.role = role != null ? role : Role.USER;
        this.provider = provider != null ? provider : AuthProvider.LOCAL;
        this.providerId = providerId;
        this.emailVerified = emailVerified != null ? emailVerified : (this.provider != AuthProvider.LOCAL);
        this.onboarded = onboarded != null ? onboarded : false;
    }

    public void updateProfile(String nickname, String profileImageUrl) {
        if (nickname != null && !nickname.isBlank()) {
            this.nickname = nickname;
        }
        if (profileImageUrl != null) {
            this.profileImageUrl = profileImageUrl;
        }
    }

    public void updateRole(Role role) {
        this.role = role;
    }

    public void changePassword(String password) {
        this.password = password;
    }

    public void verifyEmail() {
        this.emailVerified = true;
    }

    public void completeOnboarding() {
        this.onboarded = true;
    }
}
