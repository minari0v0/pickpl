package com.pickpl.app.domain.user;

import com.pickpl.app.domain.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
    name = "user_preference_tag",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_tag", columnNames = {"user_id", "tag_name"})
    }
)
public class UserPreferenceTag extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_preference_tag_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "tag_name", nullable = false, length = 50)
    private String tagName;

    public UserPreferenceTag(User user, String tagName) {
        this.user = user;
        this.tagName = tagName;
    }
}
