package com.pickpl.app.domain.tag;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "tag_click_log",
    indexes = {
        @Index(name = "idx_click_tag_created", columnList = "tag_name, created_at"),
        @Index(name = "idx_click_created_at", columnList = "created_at")
    }
)
@Getter
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TagClickLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "tag_name", nullable = false, length = 50)
    private String tagName;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public TagClickLog(Long userId, String tagName) {
        this.userId = userId;
        this.tagName = tagName;
    }
}
