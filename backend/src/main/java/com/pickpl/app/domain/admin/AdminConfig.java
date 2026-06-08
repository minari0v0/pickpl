package com.pickpl.app.domain.admin;

import jakarta.persistence.*;

@Entity
@Table(name = "admin_config")
public class AdminConfig {

    @Id
    @Column(name = "config_key", length = 100)
    private String configKey;

    @Column(name = "config_value", length = 512, nullable = false)
    private String configValue;

    protected AdminConfig() {}

    public AdminConfig(String configKey, String configValue) {
        this.configKey = configKey;
        this.configValue = configValue;
    }

    public String getConfigKey() { return configKey; }
    public String getConfigValue() { return configValue; }
    public void setConfigValue(String configValue) { this.configValue = configValue; }
}
