package com.pickpl.app.domain.tag;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "popular_mood_summary")
@Getter
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PopularMoodSummary {

    @Id
    @Column(name = "ranking")
    private Integer ranking;

    @Column(name = "tag_name", nullable = false, length = 50)
    private String tagName;

    @Column(name = "tag_type", nullable = false, length = 20)
    private String tagType; // TREND, RISING, STEADY

    @Column(name = "detail_value", length = 30)
    private String detailValue; // 예: "+23" 또는 누적 지수값

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public PopularMoodSummary(Integer ranking, String tagName, String tagType, String detailValue) {
        this.ranking = ranking;
        this.tagName = tagName;
        this.tagType = tagType;
        this.detailValue = detailValue;
    }
}
