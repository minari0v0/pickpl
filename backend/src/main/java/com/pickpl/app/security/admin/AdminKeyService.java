package com.pickpl.app.security.admin;

import com.pickpl.app.domain.admin.AdminConfig;
import com.pickpl.app.domain.admin.AdminConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminKeyService {

    private final AdminConfigRepository adminConfigRepository;

    public AdminKeyService(AdminConfigRepository adminConfigRepository) {
        this.adminConfigRepository = adminConfigRepository;
    }

    public String getAdminKey() {
        return adminConfigRepository.findById("admin_secret_key")
                .map(AdminConfig::getConfigValue)
                .orElse("admin"); // Default fallback to "admin" if not present in DB
    }

    @Transactional
    public void updateAdminKey(String newKey) {
        if (newKey == null || newKey.trim().isEmpty()) {
            throw new IllegalArgumentException("새 비밀번호는 비어 있을 수 없습니다.");
        }
        AdminConfig config = adminConfigRepository.findById("admin_secret_key")
                .orElseGet(() -> new AdminConfig("admin_secret_key", newKey.trim()));
        config.setConfigValue(newKey.trim());
        adminConfigRepository.save(config);
    }
}
