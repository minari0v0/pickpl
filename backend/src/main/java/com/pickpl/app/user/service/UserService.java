package com.pickpl.app.user.service;

import com.pickpl.app.domain.place.PlaceViewLog;
import com.pickpl.app.domain.place.PlaceViewLogRepository;
import com.pickpl.app.domain.scrap.Scrap;
import com.pickpl.app.domain.scrap.ScrapRepository;
import com.pickpl.app.domain.user.User;
import com.pickpl.app.domain.user.UserPreferenceTag;
import com.pickpl.app.domain.user.UserPreferenceTagRepository;
import com.pickpl.app.domain.user.UserRepository;
import com.pickpl.app.user.dto.DashboardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PlaceViewLogRepository placeViewLogRepository;
    private final ScrapRepository scrapRepository;
    private final UserPreferenceTagRepository userPreferenceTagRepository;
    private final com.pickpl.app.domain.vibe.VibeVoteRepository vibeVoteRepository;

    // 무드 분류 정의
    private static final List<String> PINE_COZY_TAGS = Arrays.asList("조용한", "코지한", "노트북하기좋은", "작업하기좋은", "책읽기좋은");
    private static final List<String> COFFEE_CHAT_TAGS = Arrays.asList("디저트맛집", "대형카페", "수다떨기좋은", "데이트코스", "단정함", "단체석");
    private static final List<String> HIP_VIBE_TAGS = Arrays.asList("힙한/인더스트리얼", "사진남기기좋은", "이색적인", "오션뷰", "햇살맛집", "뷰맛집");

    /**
     * 유저의 최근 뷰로그 + 스크랩 내역을 종합 분석하여 취향 대시보드 및 뱃지 업적 데이터를 반환합니다.
     */
    public DashboardResponse getUserDashboard(String userIdStr) {
        Long userId = Long.valueOf(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다. ID: " + userId));

        // 1. 유저의 최근 뷰로그(최대 50개) 수집
        List<PlaceViewLog> viewLogs = placeViewLogRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId);
        List<String> userTags = new ArrayList<>();

        for (PlaceViewLog log : viewLogs) {
            if (log.getPlace() != null && log.getPlace().getPlaceTagMaps() != null) {
                log.getPlace().getPlaceTagMaps().forEach(mapping -> {
                    if (mapping.getTag() != null) {
                        userTags.add(mapping.getTag().getName());
                    }
                });
            }
        }

        // 2. 유저의 스크랩 목록 수집
        List<Scrap> scraps = scrapRepository.findByUserId(userId);
        for (Scrap scrap : scraps) {
            if (scrap.getPlace() != null && scrap.getPlace().getPlaceTagMaps() != null) {
                scrap.getPlace().getPlaceTagMaps().forEach(mapping -> {
                    if (mapping.getTag() != null) {
                        userTags.add(mapping.getTag().getName());
                    }
                });
            }
        }

        // 3. 카테고리별 카운트 세기
        int pineCozyCount = 0;
        int coffeeChatCount = 0;
        int hipVibeCount = 0;

        for (String tag : userTags) {
            if (PINE_COZY_TAGS.contains(tag)) pineCozyCount++;
            else if (COFFEE_CHAT_TAGS.contains(tag)) coffeeChatCount++;
            else if (HIP_VIBE_TAGS.contains(tag)) hipVibeCount++;
        }

        // 4. 온보딩 관심 태그를 통한 기초 보정 (가중치 누적이 0일 경우)
        if (pineCozyCount == 0 && coffeeChatCount == 0 && hipVibeCount == 0) {
            List<UserPreferenceTag> prefTags = userPreferenceTagRepository.findByUserId(userId);
            for (UserPreferenceTag pref : prefTags) {
                String tag = pref.getTagName();
                if (PINE_COZY_TAGS.contains(tag)) pineCozyCount++;
                else if (COFFEE_CHAT_TAGS.contains(tag)) coffeeChatCount++;
                else if (HIP_VIBE_TAGS.contains(tag)) hipVibeCount++;
            }
        }

        // 5. 최후의 보정 (온보딩마저 비어있을 경우 균등 1회 부여)
        if (pineCozyCount == 0 && coffeeChatCount == 0 && hipVibeCount == 0) {
            pineCozyCount = 1;
            coffeeChatCount = 1;
            hipVibeCount = 1;
        }

        // 6. 비율 계산
        int total = pineCozyCount + coffeeChatCount + hipVibeCount;
        int pineCozyRatio = (pineCozyCount * 100) / total;
        int coffeeChatRatio = (coffeeChatCount * 100) / total;
        int hipVibeRatio = 100 - pineCozyRatio - coffeeChatRatio; // 합이 100%가 되도록 마지막에서 차감 보정

        // 7. 뱃지 정보 조립 (무드 3종 + 업적 4종)
        int goalCount = 5;
        
        DashboardResponse.BadgeDto pineBadge = createBadgeDto("PINE_COZY", "조용한 탐험가", pineCozyCount, goalCount, "🌲", "집중/조용한 분위기의 장소를 5회 이상 방문하거나 저장해 보세요.");
        DashboardResponse.BadgeDto coffeeBadge = createBadgeDto("COFFEE_CHAT", "카페 마스터", coffeeChatCount, goalCount, "☕", "대화/친목 나누기 좋은 카페를 5회 이상 방문하거나 저장해 보세요.");
        DashboardResponse.BadgeDto hipBadge = createBadgeDto("HIP_VIBE", "야간 힙스터", hipVibeCount, goalCount, "🍹", "힙하고 이색적인 분위기의 감성 공간을 5회 이상 방문하거나 저장해 보세요.");

        // 신규 업적 4종 연산
        int scrapCount = scraps.size();
        int voteCount = vibeVoteRepository.findByUserId(userId).size();
        int folderCount = (int) scraps.stream().map(Scrap::getFolderName).distinct().count();
        int totalViewCount = (int) placeViewLogRepository.countByUserId(userId);

        DashboardResponse.BadgeDto scrapBadge = createBadgeDto("BEGINNER_SCRAP", "초보 수집가", scrapCount, 5, "📦", "공간을 보관함에 5개 이상 저장해 보세요.");
        DashboardResponse.BadgeDto voteBadge = createBadgeDto("ACTIVE_VOTER", "프로 투표러", voteCount, 5, "🎟️", "공간 분위기 투표에 5회 이상 참여해 보세요.");
        DashboardResponse.BadgeDto mapBadge = createBadgeDto("MAP_MAKER", "맛집지도 제작자", folderCount, 3, "🗺️", "보관함에 보관 폴더를 3개 이상 만들어 보세요.");
        DashboardResponse.BadgeDto explorerBadge = createBadgeDto("MYSTIC_EXPLORER", "신비주의 모험가", totalViewCount, 20, "🤠", "공간 상세 페이지를 20회 이상 확인해 보세요.");

        List<DashboardResponse.BadgeDto> badges = Arrays.asList(
                pineBadge, coffeeBadge, hipBadge, scrapBadge, voteBadge, mapBadge, explorerBadge
        );

        // 8. 대표 뱃지 결정 (해금 완료된 뱃지 중 비율이 높은 것 -> 없으면 취향 탐험가)
        String representativeBadge = "취향 탐험가 🗺️";
        int maxRatio = -1;

        if ("UNLOCKED".equals(pineBadge.getStatus()) && pineCozyRatio > maxRatio) {
            representativeBadge = "조용한 탐험가 🌲";
            maxRatio = pineCozyRatio;
        }
        if ("UNLOCKED".equals(coffeeBadge.getStatus()) && coffeeChatRatio > maxRatio) {
            representativeBadge = "카페 마스터 ☕";
            maxRatio = coffeeChatRatio;
        }
        if ("UNLOCKED".equals(hipBadge.getStatus()) && hipVibeRatio > maxRatio) {
            representativeBadge = "야간 힙스터 🍹";
            maxRatio = hipVibeRatio;
        }

        // 수동 장착된 대표 칭호가 있다면 이를 최우선 반환
        if (user.getEquippedBadgeTitle() != null) {
            representativeBadge = user.getEquippedBadgeTitle();
        }

        return DashboardResponse.builder()
                .pineCozyRatio(pineCozyRatio)
                .coffeeChatRatio(coffeeChatRatio)
                .hipVibeRatio(hipVibeRatio)
                .representativeBadge(representativeBadge)
                .badges(badges)
                .build();
    }

    private DashboardResponse.BadgeDto createBadgeDto(String id, String name, int current, int goal, String emoji, String desc) {
        int progress = Math.min(100, (current * 100) / goal);
        String status = progress >= 100 ? "UNLOCKED" : (progress > 0 ? "PROGRESS" : "LOCKED");
        return DashboardResponse.BadgeDto.builder()
                .badgeId(id)
                .badgeName(name)
                .status(status)
                .progressPercentage(progress)
                .emoji(emoji)
                .description(desc)
                .build();
    }

    @Transactional
    public void updateRepresentativeBadge(String userIdStr, String badgeTitle) {
        Long userId = Long.valueOf(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다. ID: " + userId));
        
        if (badgeTitle == null || badgeTitle.trim().isEmpty()) {
            user.equipBadgeTitle(null);
        } else {
            user.equipBadgeTitle(badgeTitle);
        }
    }
}
