package com.pickpl.app.config.init;

import com.pickpl.app.domain.place.PlaceRepository;
import com.pickpl.app.place.dto.PlaceBatchRequest;
import com.pickpl.app.place.service.PlaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 개발 환경에서 더미 데이터를 자동 주입하는 초기화 스크립트.
 * DB가 비어있을 때만 작동합니다.
 */
@Slf4j
@RequiredArgsConstructor
@Component
@Profile("!prod") // 운영 환경에서는 실행되지 않도록 보호
public class DummyDataInit implements CommandLineRunner {

    private final PlaceRepository placeRepository;
    private final PlaceService placeService;

    @Override
    public void run(String... args) throws Exception {
        if (placeRepository.count() > 0) {
            log.info("이미 장소 데이터가 존재하여 더미 데이터를 주입하지 않습니다.");
            return;
        }

        log.info("데이터베이스가 비어있습니다. 고퀄리티 가짜 장소 데이터를 주입합니다...");

        PlaceBatchRequest request = new PlaceBatchRequest(List.of(
                new PlaceBatchRequest.PlaceData(
                        "스타벅스 강남대로점",
                        "서울 강남구 강남대로 123",
                        "dummy_kakao_1",
                        37.498, 127.027,
                        "카페",
                        "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
                        "[\"https://images.unsplash.com/photo-1509042239860-f550ce710b93\", \"https://images.unsplash.com/photo-1497935586351-b67a49e012bf\"]",
                        "통창으로 들어오는 햇살과 넓은 좌석이 있어 노트북 작업하기 아주 좋은 대형 카페입니다.",
                        List.of("노트북하기좋은", "대형카페", "콘센트석")
                ),
                new PlaceBatchRequest.PlaceData(
                        "오프에어 망원",
                        "서울 마포구 망원로 45",
                        "dummy_kakao_2",
                        37.556, 126.904,
                        "카페",
                        "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56",
                        "[\"https://images.unsplash.com/photo-1445116572660-236099ec97a0\"]",
                        "조용한 주택가에 위치한 빈티지 감성의 우드톤 카페로, 잔잔한 재즈 음악이 흐릅니다.",
                        List.of("우드톤", "조용한", "재즈", "비오는날")
                ),
                new PlaceBatchRequest.PlaceData(
                        "무드라운지 성수",
                        "서울 성동구 성수이로 88",
                        "dummy_kakao_3",
                        37.542, 127.056,
                        "바",
                        "https://images.unsplash.com/photo-1514933651103-005eec06c04b",
                        "[\"https://images.unsplash.com/photo-1574096079513-d8259312b78a\"]",
                        "어두운 조명과 세련된 인테리어, 트렌디한 음악이 어우러져 데이트나 친구들과의 모임에 제격인 라운지 바입니다.",
                        List.of("어두운", "힙한", "데이트", "음악이좋은")
                ),
                new PlaceBatchRequest.PlaceData(
                        "어반플랜트 합정",
                        "서울 마포구 독막로 12",
                        "dummy_kakao_4",
                        37.548, 126.915,
                        "브런치",
                        "https://images.unsplash.com/photo-1498837167169-46e4fe4ec122",
                        "[\"https://images.unsplash.com/photo-1512621776951-a57141f2eefd\"]",
                        "도심 속 숲속에 온 듯한 플랜테리어 카페로, 햇살이 가득 들어오는 테라스에서 브런치를 즐기기 좋습니다.",
                        List.of("플랜테리어", "햇살맛집", "테라스", "브런치")
                ),
                new PlaceBatchRequest.PlaceData(
                        "로우키 커피 연남",
                        "서울 마포구 연희로 1",
                        "dummy_kakao_5",
                        37.561, 126.924,
                        "카페",
                        "https://images.unsplash.com/photo-1495474472205-16284618a011",
                        "[\"https://images.unsplash.com/photo-1507133750076-458cb99dc017\"]",
                        "미니멀한 디자인과 탁 트인 통창이 매력적이며, 드립 커피가 특히 맛있는 공간입니다.",
                        List.of("미니멀", "커피맛집", "모던", "채광좋은")
                )
        ));

        placeService.saveBatch(request);
        log.info("성공적으로 더미 데이터 5개를 주입했습니다.");
    }
}
