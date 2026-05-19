package com.pickpl.app.init;

import com.pickpl.app.domain.place.Place;
import com.pickpl.app.domain.place.PlaceRepository;
import com.pickpl.app.domain.tag.Tag;
import com.pickpl.app.domain.tag.TagRepository;
import com.pickpl.app.domain.tag.TagType;
import org.slf4j.Logger;
import java.util.List;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 서버 시작 시 개발/테스트용 초기 더미 데이터를 DB에 주입합니다.
 *
 * - @Profile("!prod") : 운영(prod) 프로필에서는 절대 실행되지 않습니다.
 * - 이미 데이터가 존재하면 재삽입을 건너뜁니다. (idempotent)
 */
@Component
@Profile("!prod")
public class DataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);

    private final PlaceRepository placeRepository;
    private final TagRepository tagRepository;

    public DataLoader(PlaceRepository placeRepository, TagRepository tagRepository) {
        this.placeRepository = placeRepository;
        this.tagRepository = tagRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (placeRepository.findByExternalId("dummy_v3_1").isPresent()) {
            log.info("[DataLoader] V3 고퀄리티 더미 데이터가 이미 세팅되어 있습니다. 초기화를 건너뜁니다.");
            return;
        }

        log.info("[DataLoader] 초기 더미 데이터 삽입 시작...");

        // ── 1. 무드 태그 생성 ──────────────────────────────────────────
        Tag moodWood       = saveTag("우드톤",      TagType.MOOD);
        Tag moodCozy       = saveTag("코지함",      TagType.MOOD);
        Tag moodPlant      = saveTag("플랜테리어", TagType.MOOD);
        Tag moodVintage    = saveTag("빈티지",      TagType.MOOD);
        Tag moodModern     = saveTag("모던",        TagType.MOOD);
        Tag moodRoof       = saveTag("루프탑",      TagType.WEATHER);
        Tag facilityLaptop = saveTag("노트북가능", TagType.FACILITY);
        Tag facilityOutlet = saveTag("콘센트석",   TagType.FACILITY);
        Tag facilityPet    = saveTag("반려동물",   TagType.FACILITY);

        // ── 2. 더미 장소 생성 ──────────────────────────────────────────
        if (placeRepository.findByExternalId("KAKAO_001").isEmpty()) {
            // 장소 1 : 성수동 우드톤 카페
            Place cafe1 = new Place(
                    "어반우드 성수",
                    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
                    "KAKAO_001",
                    "서울특별시 성동구 성수이로 51",
                    37.5447, 127.0564,
                    "카페"
            );
            cafe1.setAiMoodSummary("원목 테이블과 따뜻한 조명이 어우러진 감성 카페. 혼자서 조용히 작업하기 딱 좋은 곳.");
            cafe1.addTag(moodWood);
            cafe1.addTag(moodCozy);
            cafe1.addTag(facilityLaptop);
            cafe1.addTag(facilityOutlet);
            placeRepository.save(cafe1);

            // 장소 2 : 이태원 빈티지 바
            Place bar1 = new Place(
                    "그루브 이태원",
                    "https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=800",
                    "KAKAO_002",
                    "서울특별시 용산구 이태원로 177",
                    37.5345, 126.9943,
                    "바"
            );
            bar1.setAiMoodSummary("빈티지 레코드판과 은은한 조명이 가득한 소울 바. 금요일 밤 분위기 만점.");
            Tag moodSecret = saveTag("나만아는", TagType.MOOD);
            bar1.addTag(moodVintage);
            bar1.addTag(moodCozy);
            bar1.addTag(moodSecret);
            placeRepository.save(bar1);

            // 장소 3 : 연남동 플랜테리어 브런치
            Place brunch1 = new Place(
                    "그린 테이블 연남",
                    "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800",
                    "KAKAO_003",
                    "서울특별시 마포구 연남로 45",
                    37.5624, 126.9230,
                    "브런치"
            );
            brunch1.setAiMoodSummary("초록 식물들과 화이트 인테리어가 조화로운 플랜테리어 감성 브런치 카페.");
            brunch1.addTag(moodPlant);
            brunch1.addTag(moodModern);
            brunch1.addTag(facilityPet);
            placeRepository.save(brunch1);

            // 장소 4 : 한남동 루프탑 레스토랑
            Place resto1 = new Place(
                    "스카이 다이닝 한남",
                    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
                    "KAKAO_004",
                    "서울특별시 용산구 한남대로 42길 12",
                    37.5346, 127.0007,
                    "레스토랑"
            );
            resto1.setAiMoodSummary("한강 뷰가 펼쳐지는 루프탑 다이닝. 특별한 날 방문하기 완벽한 분위기.");
            resto1.addTag(moodRoof);
            resto1.addTag(moodModern);
            placeRepository.save(resto1);

            // 장소 5 : 홍대 모던 스터디 카페
            Place cafe2 = new Place(
                    "포커스 홍대",
                    "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800",
                    "KAKAO_005",
                    "서울특별시 마포구 홍익로 5길 17",
                    37.5575, 126.9245,
                    "카페"
            );
            cafe2.setAiMoodSummary("군더더기 없는 모던한 공간. 집중이 잘 되는 조용한 스터디 카페.");
            cafe2.addTag(facilityLaptop);
            cafe2.addTag(facilityOutlet);
            placeRepository.save(cafe2);
        }

        // ── 3. [V3] 신규 고퀄리티 더미 장소 5개 추가 ─────────────────────
        // 이전 테스트로 생성된 쓰레기 데이터 정리
        List<String> garbageIds = List.of(
                "dummy_kakao_1", "dummy_kakao_2", "dummy_kakao_3", "dummy_kakao_4", "dummy_kakao_5",
                "dummy_v2_3", "dummy_v2_4", "dummy_v2_5"
        );
        for (String gid : garbageIds) {
            placeRepository.findByExternalId(gid).ifPresent(p -> {
                p.getPlaceTagMaps().clear();
                placeRepository.delete(p);
            });
        }

        // 신규 장소 주입
        insertV3Place("스타벅스 강남대로점", "서울 강남구 강남대로 123", "dummy_v3_1", 37.498, 127.027, "카페",
                "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800",
                "통창으로 들어오는 햇살과 넓은 좌석이 있어 노트북 작업하기 아주 좋은 대형 카페입니다.",
                List.of(saveTag("노트북가능", TagType.FACILITY), moodModern, facilityOutlet));

        insertV3Place("오프에어 망원", "서울 마포구 망원로 45", "dummy_v3_2", 37.556, 126.904, "카페",
                "https://images.unsplash.com/photo-1445116572660-236099ec97a0?q=80&w=800",
                "조용한 주택가에 위치한 빈티지 감성의 우드톤 카페로, 잔잔한 재즈 음악이 흐릅니다.",
                List.of(moodWood, moodCozy, moodVintage, saveTag("조용한", TagType.MOOD)));

        insertV3Place("무드라운지 성수", "서울 성동구 성수이로 88", "dummy_v3_3", 37.542, 127.056, "바",
                "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800",
                "어두운 조명과 세련된 인테리어, 트렌디한 음악이 어우러져 데이트나 친구들과의 모임에 제격인 라운지 바입니다.",
                List.of(saveTag("어두운", TagType.MOOD), saveTag("데이트", TagType.MOOD), saveTag("음악이좋은", TagType.MOOD)));

        insertV3Place("어반플랜트 합정", "서울 마포구 독막로 12", "dummy_v3_4", 37.548, 126.915, "브런치",
                "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800",
                "도심 속 숲속에 온 듯한 플랜테리어 카페로, 햇살이 가득 들어오는 테라스에서 브런치를 즐기기 좋습니다.",
                List.of(moodPlant, saveTag("테라스", TagType.FACILITY), saveTag("햇살맛집", TagType.MOOD)));

        insertV3Place("로우키 커피 연남", "서울 마포구 연희로 1", "dummy_v3_5", 37.561, 126.924, "카페",
                "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800",
                "미니멀한 디자인과 탁 트인 통창이 매력적이며, 드립 커피가 특히 맛있는 공간입니다.",
                List.of(moodModern, saveTag("채광좋은", TagType.MOOD), saveTag("커피맛집", TagType.MOOD)));

        log.info("[DataLoader] 더미 데이터 삽입 및 쓰레기 데이터 정리 완료! (총 장소 10개 완비)");
    }

    private void insertV3Place(String name, String address, String extId, double lat, double lng, String cat, String img, String desc, List<Tag> tags) {
        if (placeRepository.findByExternalId(extId).isPresent()) return;
        Place p = new Place(name, img, extId, address, lat, lng, cat);
        p.setAiMoodSummary(desc);
        placeRepository.save(p);
        for (Tag t : tags) {
            p.addTag(t);
        }
    }

    /** 태그가 이미 있으면 재사용, 없으면 새로 저장하는 헬퍼 메서드. */
    private Tag saveTag(String name, TagType type) {
        return tagRepository.findByNameAndType(name, type)
                .orElseGet(() -> tagRepository.save(new Tag(name, type)));
    }
}
