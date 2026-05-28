package com.pickpl.app.domain.place;

import com.pickpl.app.domain.common.BaseTimeEntity;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

/**
 * 공간(장소) 엔티티.
 * - Tag와 다대다(N:M) 관계를 PlaceTagMap을 통해 관리합니다.
 * - Scrap과 일대다(1:N) 관계를 가집니다.
 */
@Entity
@Table(name = "place")
public class Place extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "place_id")
    private Long id;

    /** 공간 이름 */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 대표 썸네일 이미지 URL.
     * 룩북 피드에 표시되는 480px 이상 고화질 사진을 가리킵니다.
     * 카카오/네이버 API에서 수집한 원본 URL을 핫링킹 방식으로 사용합니다.
     */
    @Column(name = "thumbnail_url", nullable = false, length = 2048)
    private String thumbnailUrl;

    /**
     * 추가 사진 URL 목록 (JSON 배열 문자열로 저장).
     * 공간 상세 페이지의 슬라이드에 활용됩니다.
     */
    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;

    /** 카카오/네이버 플레이스 고유 ID (외부 API 연동 키) */
    @Column(name = "external_id", unique = true, length = 100)
    private String externalId;

    /** 도로명 주소 */
    @Column(length = 255)
    private String address;

    /** 위도 */
    @Column(precision = 10)
    private Double latitude;

    /** 경도 */
    @Column(precision = 10)
    private Double longitude;

    /** 카테고리 (예: 카페, 레스토랑, 바) */
    @Column(length = 50)
    private String category;

    /**
     * AI가 분석한 공간의 무드 요약 텍스트.
     * 예: "우드톤, 코지한 감성의 플랜테리어 카페"
     */
    @Column(name = "ai_mood_summary", columnDefinition = "TEXT")
    private String aiMoodSummary;

    /** 조용함 투표 수 */
    @Column(name = "quiet_vote_count", nullable = false)
    private int quietVoteCount = 0;

    /** 대화하기 좋음 투표 수 */
    @Column(name = "chatty_vote_count", nullable = false)
    private int chattyVoteCount = 0;

    /** 에디터의 한마디 */
    @Column(name = "editors_comment", length = 255)
    private String editorsComment;

    /** 공개 여부 플래그 */
    @Column(name = "is_published", nullable = false)
    private boolean isPublished = false;

    // --- 연관관계 ---

    /** Place-Tag 다대다 매핑 (연관관계 주인: PlaceTagMap) */
    @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlaceTagMap> placeTagMaps = new ArrayList<>();

    /** 이 공간을 스크랩한 내역 */
    @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<com.pickpl.app.domain.scrap.Scrap> scraps = new ArrayList<>();

    // --- 생성자 ---

    protected Place() {}

    public Place(String name, String thumbnailUrl, String externalId, String address,
                 Double latitude, Double longitude, String category) {
        this.name = name;
        this.thumbnailUrl = thumbnailUrl;
        this.externalId = externalId;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.category = category;
    }

    // --- 연관관계 편의 메서드 ---

    /**
     * Tag를 이 공간에 추가합니다.
     * PlaceTagMap 중간 테이블 인스턴스를 생성하고 양쪽 컬렉션에 등록합니다.
     */
    public void addTag(com.pickpl.app.domain.tag.Tag tag) {
        PlaceTagMap mapping = new PlaceTagMap(this, tag);
        this.placeTagMaps.add(mapping);
        tag.getPlaceTagMaps().add(mapping);
    }

    /**
     * 특정 Tag를 이 공간에서 제거합니다.
     */
    public void removeTag(com.pickpl.app.domain.tag.Tag tag) {
        placeTagMaps.removeIf(m -> m.getTag().equals(tag));
        tag.getPlaceTagMaps().removeIf(m -> m.getPlace().equals(this));
    }

    // --- Getters ---

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public String getImageUrls() { return imageUrls; }
    public String getExternalId() { return externalId; }
    public String getAddress() { return address; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getCategory() { return category; }
    public String getAiMoodSummary() { return aiMoodSummary; }
    public List<PlaceTagMap> getPlaceTagMaps() { return placeTagMaps; }
    public List<com.pickpl.app.domain.scrap.Scrap> getScraps() { return scraps; }

    public int getQuietVoteCount() { return quietVoteCount; }
    public int getChattyVoteCount() { return chattyVoteCount; }
    public String getEditorsComment() { return editorsComment; }
    public boolean isPublished() { return isPublished; }

    // --- Setters (AI 파이프라인 및 어드민이 사용) ---

    public void setImageUrls(String imageUrls) { this.imageUrls = imageUrls; }
    public void setAiMoodSummary(String aiMoodSummary) { this.aiMoodSummary = aiMoodSummary; }
    public void setEditorsComment(String editorsComment) { this.editorsComment = editorsComment; }
    public void setPublished(boolean published) { this.isPublished = published; }

    // --- 비즈니스 로직 ---
    
    public void incrementVibeVote(com.pickpl.app.domain.vibe.VibeType type) {
        if (type == com.pickpl.app.domain.vibe.VibeType.QUIET) {
            this.quietVoteCount++;
        } else if (type == com.pickpl.app.domain.vibe.VibeType.CHATTY) {
            this.chattyVoteCount++;
        }
    }

    public void decrementVibeVote(com.pickpl.app.domain.vibe.VibeType type) {
        if (type == com.pickpl.app.domain.vibe.VibeType.QUIET && this.quietVoteCount > 0) {
            this.quietVoteCount--;
        } else if (type == com.pickpl.app.domain.vibe.VibeType.CHATTY && this.chattyVoteCount > 0) {
            this.chattyVoteCount--;
        }
    }
}
