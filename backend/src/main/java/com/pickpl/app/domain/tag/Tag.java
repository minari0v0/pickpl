package com.example.demo.domain.tag;

import com.example.demo.domain.common.BaseTimeEntity;
import com.example.demo.domain.place.PlaceTagMap;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

/**
 * AI가 자동 생성하는 무드/시설 태그 엔티티.
 *
 * 태그 유형(type):
 *  - MOOD     : 분위기 태그 (예: 우드톤, 코지함, 빈티지)
 *  - FACILITY : 시설 태그  (예: 콘센트석, 노트북가능, 주차가능)
 *  - WEATHER  : 날씨 태그  (예: 비오는날, 야외테라스)
 *
 * AI 파이프라인이 반환하는 JSON:
 *  { "mood": ["우드톤", "코지함"], "facility": ["노트북작업"] }
 * 에서 각 값이 Tag 레코드 하나에 해당합니다.
 */
@Entity
@Table(name = "tag",
        uniqueConstraints = @UniqueConstraint(columnNames = {"name", "type"}))
public class Tag extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_id")
    private Long id;

    /** 태그 표시 이름 (예: "우드톤", "콘센트석") */
    @Column(nullable = false, length = 50)
    private String name;

    /** 태그 유형 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TagType type;

    // --- 연관관계 ---

    /** Place-Tag 다대다 매핑 (연관관계 주인: PlaceTagMap) */
    @OneToMany(mappedBy = "tag", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlaceTagMap> placeTagMaps = new ArrayList<>();

    // --- 생성자 ---

    protected Tag() {}

    public Tag(String name, TagType type) {
        this.name = name;
        this.type = type;
    }

    // --- Getters ---

    public Long getId() { return id; }
    public String getName() { return name; }
    public TagType getType() { return type; }
    public List<PlaceTagMap> getPlaceTagMaps() { return placeTagMaps; }

    // --- equals / hashCode (비즈니스 키 기반) ---

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Tag tag)) return false;
        return name.equals(tag.name) && type == tag.type;
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(name, type);
    }
}
