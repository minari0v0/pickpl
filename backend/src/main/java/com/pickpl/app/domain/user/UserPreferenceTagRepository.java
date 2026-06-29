package com.pickpl.app.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserPreferenceTagRepository extends JpaRepository<UserPreferenceTag, Long> {
    List<UserPreferenceTag> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
