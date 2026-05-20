# 🌿 PickPl 차세대 감성 엔진 및 실시간 협업 아키텍처 명세서
> **PickPl Next-Gen Mood Engine & Collaborative Architecture Specification**
>
> 본 명세서는 픽플(PickPl) 플랫폼의 중장기 서비스 확장과 고성능 개인화를 실현하기 위한 **기상 맞춤형 큐레이션 알고리즘**, **유튜브식 하이브리드 추천 엔진**, 그리고 **실시간 공동 Vibe 플래너 세션**의 시스템 아키텍처 및 데이터 흐름을 규정합니다.

---

## 목차
1. [기상 & 계절별 감성 큐레이션 알고리즘 (Weather & Season Curation)](#1-기상--계절별-감성-큐레이션-알고리즘)
2. [유튜브식 개인화 추천 엔진 (Personalized Recommendation Engine)](#2-유튜브식-개인화-추천-엔진)
3. [실시간 공동 Vibe 플래너 세션 아키텍처 (Collaborative Vibe Planner Session)](#3-실시간-공동-vibe-플래너-세션-아키텍처)

---

## 1. 기상 & 계절별 감성 큐레이션 알고리즘

사용자의 현재 위치를 기반으로 실시간 날씨와 계절에 어울리는 감성 공간을 0.1초 만에 큐레이션하여 메인 배너 및 추천 영역에 노출하는 지능형 모듈입니다.

### 1.1 시스템 흐름도 (Data Pipeline Flow)
```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자 앱
    participant Web as Next.js 프론트엔드
    participant App as Spring Boot 백엔드
    participant Redis as Redis 캐시
    participant WAPI as OpenWeatherMap API
    participant DB as MySQL 데이터베이스

    User->>Web: 메인 페이지 진입
    Web->>App: GET /api/v1/curation?lat=37.566&lon=126.978
    App->>Redis: 실시간 기상 캐시 조회 (위경도 격자 기반)
    alt 캐시 미존재 (Cache Miss)
        App->>WAPI: 날씨 정보 조회 (온도, 습도, 강수량 등)
        WAPI-->>App: JSON Response (Weather State)
        App->>Redis: 기상 정보 캐싱 (TTL 1시간)
    else 캐시 존재 (Cache Hit)
        Redis-->>App: 캐시된 기상 데이터 반환
    end
    App->>App: 계절(Month) 및 날씨 판정 모듈 작동
    App->>DB: 큐레이션 매트릭스 매칭 공간 쿼리 (Vibe Score 내림차순)
    DB-->>App: 공간 리스트 반환 (2~3곳 추천)
    App-->>Web: 큐레이션 테마, 배경 정보 및 공간 정보 반환
    Web-->>User: 감성 큐레이션 카드 및 Lookbook 완성
```

### 1.2 계절 및 기상 상태 판정 기준 (Curation Matrix)
백엔드는 기상청 단기예보 및 OpenWeatherMap의 날씨 코드를 수신하여 다음과 같이 감성 테마를 자동으로 결정합니다.

| 분류 | 기상 조건 및 판정 범위 | 매칭 감성 태그 | 추천 테마 타이틀 (예시) |
| :--- | :--- | :--- | :--- |
| **초봄 (Chilly Spring)** | 3월 ~ 4월 중순 / 평균 기온 10℃ 이하 | `#우드톤`, `#조용한`, `#따뜻한` | 쌀쌀한 초봄, 온기 가득한 실내에서 나누는 대화 |
| **봄/초여름 (Warm Spring)**| 4월 중순 ~ 5월 / 평균 기온 15℃ ~ 22℃| `#햇살맛집`, `#테라스`, `#플랜테리어` | 봄바람 부는 날, 테라스에서 채광 맛보기 |
| **싱그러운 여름 (Lush Summer)**| 6월 ~ 7월 중순 / 맑고 온화함 | `#플랜테리어`, `#야외테라스`, `#채광좋은` | 싱그러운 초록이 가득한 여름날의 정원 |
| **바캉스 여름 (Summer Vacation)**| 7월 말 ~ 8월 / 평균 기온 28℃ 이상 | `#힙한`, `#루프탑`, `#이색적인` | 일상을 벗어난 휴양지 무드와 이색 오아시스 |
| **가을날 (Crisp Autumn)** | 9월 ~ 11월 / 맑고 쾌적함 | `#조용한`, `#노트북하기좋은`, `#재즈` | 고요하게 가을빛을 느끼며 사색에 잠기기 좋은 곳 |
| **하얀 겨울 (Cozy Winter)** | 12월 ~ 2월 / 평균 기온 0℃ 이하 | `#코지한`, `#아늑한`, `#따뜻한 분위기` | 추위를 녹여줄 포근한 벽난로 감성의 아지트 |
| **비 오는 날 (Rainy Vibe)** | 사계절 공통 / 강수 감지 시 최우선순위| `#비오는날`, `#창가자리`, `#조용한` | 통창 너머 흐르는 빗방울을 보며 머무는 시간 |

### 1.3 큐레이션 랭킹 스코어 모델 (Curation Rank Scoring)
특정 큐레이션 테마에 속하는 공간의 노출 우선순위는 아래 스코어링 공식에 의해 계산됩니다.
$$Score = W_s \cdot (SeasonMatch) + W_w \cdot (WeatherMatch) + W_p \cdot (VibeScore)$$

- **$SeasonMatch$**: 해당 공간이 가진 태그와 현재 계절 가중치 매칭률 (0.0 ~ 1.0)
- **$WeatherMatch$**: 해당 공간이 가진 태그와 현재 기상 가중치 매칭률 (0.0 ~ 1.0)
- **$VibeScore$**: 플랫폼 내 사용자들이 투표한 해당 공간의 신뢰 무드 기여율 (예: 대화하기 좋은 분위기가 65% 이상일 때 가중치 부여)
- **가중치 정의**: $W_s = 0.35, W_w = 0.45, W_p = 0.20$

---

## 2. 유튜브식 개인화 추천 엔진

단순한 무드 태그 분류를 넘어, 사용자의 누적 활동 로그(Implicit Feedback)를 분석하여 사용자가 좋아할 가능성이 가장 높은 공간들을 메인 탭 피드에 실시간 개인화 배치하는 인공지능 추천 아키텍처입니다.

### 2.1 하이브리드 추천 모델 아키텍처
추천 엔진은 **콘텐츠 기반 필터링(Content-Based Filtering)**과 **협업 필터링(Collaborative Filtering)**의 강점을 결합한 하이브리드(Hybrid) 방식을 채택합니다.

```
                  [ 사용자 활동 로그 ]
             (조회, 스크랩, 분위기 투표, 리뷰)
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
[ 협업 필터링 (CF) ]             [ 콘텐츠 기반 필터링 (CBF) ]
- 유사한 취향의 사용자들이       - 사용자의 개인 무드 프로필 벡터와
  찜한 공간 후보군 추출           공간별 AI 요약 무드 벡터의 유사도 계산
(Matrix Factorization / ALS)     (TF-IDF & Cosine Similarity)
         │                                 │
         └────────────────┬────────────────┘
                          ▼
            [ 랭킹 및 필터링 레이어 ]
            - 인기 지수(Popularity Rank) 결합
            - 이미 방문 기록을 남긴 공간 필터링
                          │
                          ▼
              [ 개인화된 공간 추천 피드 ]
```

### 2.2 수학적 데이터 모델링 및 알고리즘

#### A. 사용자 무드 프로필 벡터 (User Mood Profile Vector)
사용자 $u$가 플랫폼 내에서 소비한 공간 $p$들의 무드 태그 가중치를 통해 사용자 무드 프로필 벡터 $\vec{U}_u$를 구축합니다.
$$\vec{U}_u = \sum_{p \in P_u} \alpha(u, p) \cdot \vec{V}_p$$
- **$P_u$**: 사용자 $u$가 피드백을 보낸 전체 공간 세트
- **$\vec{V}_p$**: 공간 $p$의 무드 태그 벡터 (TF-IDF 방식으로 계산된 가중치 벡터)
- **$\alpha(u, p)$**: 사용자 행동 방식에 따른 감성 강도 가중치:
  - 공간 단순 상세 보기: $+1$
  - 분위기 투표 참여: $+2$
  - 나만의 폴더에 스크랩(저장): $+4$
  - 긍정적 리뷰 및 코멘트 작성: $+5$

#### B. 콘텐츠 유사도 매칭 (Cosine Similarity)
사용자 무드 프로필 $\vec{U}_u$와 임의의 공간 $p$의 무드 벡터 $\vec{V}_p$ 간의 코사인 유사도를 통해 매칭 지수를 산출합니다.
$$Sim(u, p) = \frac{\vec{U}_u \cdot \vec{V}_p}{\|\vec{U}_u\| \|\vec{V}_p\|}$$

#### C. 최신 인기 보정 지수 (Time-Decayed Popularity Score)
오래된 인기 장소에 편중되는 현상을 방지하기 위해, 조회수 및 리뷰수에 시간 감쇄 함수(Exponential Time Decay)를 적용하여 추천 점수를 보정합니다.
$$PopScore(p) = \left( \frac{Views_p + 2 \cdot Scraps_p}{1} \right) \cdot e^{-\lambda(t_{current} - t_{created})}$$
- **$\lambda$**: 시간 경과에 따른 감쇄 계수
- **$t_{current} - t_{created}$**: 공간 등록 이후 경과된 일수(days)

### 2.3 추천 API 설계 (Endpoint Specification)

#### [GET] /api/v1/places/recommendations
사용자 식별 토큰(Bearer JWT)을 감지하여 고도화된 개인화 공간 리스트를 반환합니다. 비로그인 세션일 경우 시스템 인기 보정 지수가 높은 순으로 디폴트 정렬하여 반환합니다.

- **Request Headers**:
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```
- **Response JSON (200 OK)**:
  ```json
  {
    "status": "SUCCESS",
    "data": {
      "recommendationType": "PERSONALIZED_HYBRID",
      "userPrimaryMood": "햇살맛집",
      "recommendedPlaces": [
        {
          "placeId": 4,
          "name": "어반플랜트 합정",
          "matchRatio": 94,
          "reason": "최근 솜님이 스크랩한 '오프에어 망원'과 같이 햇살 가득한 플랜테리어 무드를 즐겨 찾으시는 분께 추천해요.",
          "address": "서울 마포구 독막로 12",
          "category": "브런치",
          "thumbnailUrl": "https://images.unsplash.com/photo-1497935586351-b67a49e012bf"
        }
      ]
    }
  }
  ```

---

## 3. 실시간 공동 Vibe 플래너 세션 아키텍처

여러 명의 사용자가 하나의 플랜 세션(방)을 공유하며, 픽플에서 탐색한 공간들을 공동 위시리스트에 담고, 실시간으로 투표 및 피드백을 주고받아 여정을 완성해 가는 협업 모듈입니다.

### 3.1 시스템 아키텍처 (STOMP Web Socket Integration)
실시간 양방향 데이터 싱크를 보장하며 다중 서버 환경에서도 안정적으로 세션을 관리하기 위한 시스템 구성도입니다.

```
       [ Client A ]                [ Client B ]
            │                           │
  HTTP      │ WebSocket/STOMP           │ HTTP
 (REST API) │ (실시간 투표/동기화)       │ (REST API)
            ▼                           ▼
┌──────────────────────────────────────────────┐
│             Next.js Frontend                 │
└──────────────────────────────────────────────┘
                    │  ▲ (STOMP Broker Channel)
                    ▼  │
┌──────────────────────────────────────────────┐
│           Spring Boot Application            │
│   ┌──────────────────────────────────────┐   │
│   │   WebSocketMessageBrokerConfig       │   │
│   └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
       │                                 │
       ▼                                 ▼
┌──────────────────┐             ┌──────────────┐
│   Redis Server   │             │  MySQL DB    │
│ - Live Session   │             │ - 플랜 세션  │
│   Lobby State    │             │   영속 데이터│
│ - Pub/Sub Broker │             │ - 최종 루트  │
└──────────────────┘             └──────────────┘
```

### 3.2 실시간 세션 데이터 모델 (MySQL & Redis Schema)

#### MySQL - `vibe_planner_session` (물리 스키마)
플래너 세션의 기본 마스터 정보와 영속 데이터를 저장합니다.
```sql
CREATE TABLE vibe_planner_session (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(10) NOT NULL UNIQUE,  -- 'PKPL-948A' 같은 초대 코드
    title VARCHAR(100) NOT NULL,            -- 세션 제목
    host_id BIGINT NOT NULL,                -- 방장 ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Redis - `session:lobby:{room_code}` (메모리 구조)
가장 빈번하게 변경되는 실시간 로비 내 접속자 현황 및 추가된 공간 리스트, 사용자별 찬/반 투표 상태(Voting State)를 고속 관리하기 위한 해시 구조입니다.
```json
{
  "roomCode": "PKPL-948A",
  "activeMembers": [
    {"userId": 1, "nickname": "솜이 (호스트)", "avatar": "cat_profile"},
    {"userId": 2, "nickname": "지우", "avatar": "fox_profile"},
    {"userId": 3, "nickname": "민우", "avatar": "bear_profile"}
  ],
  "wishlist": [
    {
      "placeId": 4,
      "placeName": "어반플랜트 합정",
      "addedBy": "솜이",
      "votes": {
        "userId_1": "UP",
        "userId_2": "UP",
        "userId_3": "DOWN"
      },
      "upCount": 2,
      "downCount": 1
    }
  ]
}
```

### 3.3 STOMP 실시간 메시징 프로토콜 규격
프론트엔드와 백엔드가 소켓 연결을 확립한 후 주고받는 메시지 프로토콜 규격입니다.

#### A. 세션 채널 구독 (Subscribe Path)
- **로비 실시간 업데이트 수신 구독 채널**: `/topic/planner/{roomCode}`
- **개별 사용자 실시간 알림 수신 구독 채널**: `/queue/planner/{userId}`

#### B. 공간 추가 이벤트 송신 (Send Path)
공간 상세 탐색 화면에서 "플래너에 추가"를 터치했을 때 발행되는 액션 메시지 프레임입니다.
- **Destination**: `/app/planner/{roomCode}/add-place`
- **Payload**:
  ```json
  {
    "userId": 1,
    "nickname": "솜이",
    "placeId": 4,
    "placeName": "어반플랜트 합정",
    "thumbnailUrl": "https://images.unsplash.com/photo-1497935586351-b67a49e012bf"
  }
  ```

#### C. 실시간 공간 투표 이벤트 송신 (Send Path)
세션에 참가 중인 사용자가 해당 공간에 대해 투표를 행사했을 때 발행되는 액션 메시지 프레임입니다.
- **Destination**: `/app/planner/{roomCode}/vote-place`
- **Payload**:
  ```json
  {
    "userId": 2,
    "placeId": 4,
    "voteType": "UP" // 'UP' (좋아요 👍) 또는 'DOWN' (글쎄 🤔)
  }
  ```

#### D. 브로드캐스팅 로비 갱신 응답 (Broadcast Payload)
이벤트 수신 시 백엔드는 계산된 새로운 로비 구조를 실시간 채널(`/topic/planner/{roomCode}`)에 구독 중인 모든 클라이언트에게 즉시 전송합니다.
```json
{
  "eventType": "PLACE_VOTED",
  "targetPlaceId": 4,
  "votedBy": "지우",
  "voteType": "UP",
  "updatedWishlist": [
    {
      "placeId": 4,
      "upCount": 3,
      "downCount": 0,
      "vibeStatus": "PERFECT_MATCH"
    }
  ]
}
```

---

## 4. 결론 및 향후 로드맵
본 명세서는 픽플의 프리미엄 감성 정체성을 기술적으로 뒷받침하는 핵심 근간이 될 것입니다. 
1. **1단계**: 본 설계에 기반한 데이터 바인딩 스키마를 MySQL에 반영.
2. **2단계**: Spring Boot WebSocket 설정 및 STOMP 메시지 브로커 통합.
3. **3단계**: 외부 기상 정보 연계 크론잡 개발 및 사용자 무드 프로파일링 TF-IDF 유사도 모델 구현.
