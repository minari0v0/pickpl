package com.pickpl.app.visit.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Schema(description = "관리자용 방문 기록 관리 응답 DTO")
public class AdminVisitResponse {

    @Schema(description = "방문 기록 고유 ID", example = "1")
    private Long id;

    @Schema(description = "작성자 유저 ID", example = "5")
    private Long userId;

    @Schema(description = "작성자 닉네임", example = "성수동방랑자")
    private String nickname;

    @Schema(description = "방문한 장소 ID", example = "12")
    private Long placeId;

    @Schema(description = "방문한 장소명", example = "블루보틀 성수")
    private String placeName;

    @Schema(description = "방문 한줄평 후기", example = "조용히 일하기 좋은 최적의 카페입니다.")
    private String comment;

    @Schema(description = "방문 날짜", example = "2026-06-28")
    private LocalDate visitedDate;

    @Schema(description = "생성 일시", example = "2026-06-28T00:15:30")
    private LocalDateTime createdAt;

    public AdminVisitResponse() {}

    public AdminVisitResponse(Long id, Long userId, String nickname, Long placeId, String placeName, String comment, LocalDate visitedDate, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.nickname = nickname;
        this.placeId = placeId;
        this.placeName = placeName;
        this.comment = comment;
        this.visitedDate = visitedDate;
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

    public Long getPlaceId() {
        return placeId;
    }

    public String getPlaceName() {
        return placeName;
    }

    public String getComment() {
        return comment;
    }

    public LocalDate getVisitedDate() {
        return visitedDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
