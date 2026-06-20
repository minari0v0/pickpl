package com.pickpl.app.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SocialConnectionRepository extends JpaRepository<SocialConnection, Long> {
    Optional<SocialConnection> findByProviderAndProviderId(String provider, String providerId);
    List<SocialConnection> findByUser(User user);
    List<SocialConnection> findByUserId(Long userId);
    boolean existsByProviderAndProviderId(String provider, String providerId);
    void deleteByUserId(Long userId);
}
