package com.pickpl.app.auth.dto;

import com.pickpl.app.domain.user.UserSession;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Duration;
import java.time.LocalDateTime;

@Schema(description = "로그인 기기 세션 정보 응답 DTO")
public record UserSessionResponse(
    @Schema(description = "세션 ID", example = "1")
    Long id,
    
    @Schema(description = "접속 지역 (IP 주소 기반)", example = "Seoul")
    String location,
    
    @Schema(description = "최종 접근 경과 시간", example = "방금 전")
    String lastAccessed,
    
    @Schema(description = "접속 디바이스/OS", example = "Windows")
    String device,
    
    @Schema(description = "접속 브라우저", example = "Chrome")
    String browser,
    
    @Schema(description = "현재 사용 중인 세션 여부", example = "true")
    boolean isCurrent
) {
    public static UserSessionResponse of(UserSession session, String currentRefreshToken) {
        boolean isCurrent = session.getRefreshTokenUuid() != null && session.getRefreshTokenUuid().equals(currentRefreshToken);
        
        return new UserSessionResponse(
            session.getId(),
            session.getLocation(),
            formatLastAccessed(session.getLastAccessedAt()),
            session.getDevice(),
            session.getBrowser(),
            isCurrent
        );
    }

    private static String formatLastAccessed(LocalDateTime lastAccessedAt) {
        if (lastAccessedAt == null) return "알 수 없음";
        
        Duration duration = Duration.between(lastAccessedAt, LocalDateTime.now());
        long seconds = duration.getSeconds();
        if (seconds < 0) seconds = 0; // 혹시 모를 오차 방지
        
        if (seconds < 60) {
            return "방금 전";
        }
        long minutes = duration.toMinutes();
        if (minutes < 60) {
            return minutes + "분 전";
        }
        long hours = duration.toHours();
        if (hours < 24) {
            return hours + "시간 전";
        }
        long days = duration.toDays();
        return days + "일 전";
    }
}
