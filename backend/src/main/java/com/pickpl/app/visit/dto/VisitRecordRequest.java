package com.pickpl.app.visit.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Schema(description = "방문 기록 생성 및 수정 요청 DTO")
public class VisitRecordRequest {

    @Schema(description = "장소 ID", example = "12", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "장소 ID는 필수입니다.")
    private Long placeId;

    @Schema(description = "방문 한줄평 후기 (최대 1000자)", example = "조용히 일하기 좋은 최적의 카페입니다. 커피도 맛있어요!", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "한줄평 내용은 필수입니다.")
    @Size(max = 1000, message = "한줄평은 최대 1000자까지 입력 가능합니다.")
    private String comment;

    @Schema(description = "방문 날짜", example = "2026-06-28", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "방문 날짜는 필수입니다.")
    private LocalDate visitedDate;

    public VisitRecordRequest() {}

    public VisitRecordRequest(Long placeId, String comment, LocalDate visitedDate) {
        this.placeId = placeId;
        this.comment = comment;
        this.visitedDate = visitedDate;
    }

    public Long getPlaceId() {
        return placeId;
    }

    public void setPlaceId(Long placeId) {
        this.placeId = placeId;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDate getVisitedDate() {
        return visitedDate;
    }

    public void setVisitedDate(LocalDate visitedDate) {
        this.visitedDate = visitedDate;
    }
}
