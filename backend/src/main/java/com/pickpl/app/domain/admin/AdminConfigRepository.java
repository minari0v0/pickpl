package com.pickpl.app.domain.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminConfigRepository extends JpaRepository<AdminConfig, String> {
}
