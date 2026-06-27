package com.pickpl.app.visit.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Schema(description = "방문 기록 조회 응답 DTO")
public class VisitRecordResponse {

    @Schema(description = "방문 기록 고유 ID", example = "1")
    private Long id;

    @Schema(description = "작성자 유저 ID", example = "5")
    private Long userId;

    @Schema(description = "작성자 닉네임", example = "성수동방랑자")
    private String nickname;

    @Schema(description = "작성자 프로필 이미지 URL", example = "https://api.dicebear.com/7.x/notionists/svg?seed=avatar")
    private String profileImageUrl;

    @Schema(description = "방문 한줄평 후기", example = "조용히 일하기 좋은 최적의 카페입니다.")
    private String comment;

    @Schema(description = "방문 날짜", example = "2026-06-28")
    private LocalDate visitedDate;

    @Schema(description = "현재 요청 유저가 작성한 기록인지 여부", example = "true")
    private boolean isMyRecord;

    @Schema(description = "생성 일시", example = "2026-06-28T00:15:30")
    private LocalDateTime createdAt;

    public VisitRecordResponse() {}

    public VisitRecordResponse(Long id, Long userId, String nickname, String profileImageUrl, String comment, LocalDate visitedDate, boolean isMyRecord, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.comment = comment;
        this.visitedDate = visitedDate;
        this.isMyRecord = isMyRecord;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getNickname() {
        return nickname;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public String getComment() {
        return comment;
    }

    public LocalDate getVisitedDate() {
        return visitedDate;
    }

    public boolean isIsMyRecord() {
        return isMyRecord;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
