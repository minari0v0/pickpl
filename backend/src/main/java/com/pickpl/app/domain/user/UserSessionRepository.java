package com.pickpl.app.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUserId(Long userId);
    Optional<UserSession> findByRefreshTokenUuid(String refreshTokenUuid);
    void deleteByRefreshTokenUuid(String refreshTokenUuid);
    void deleteByUserId(Long userId);
}
