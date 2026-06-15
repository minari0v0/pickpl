# 📍 PickPl 편의시설 태그 수집 및 사용자 위치 기반 추천 피드 설계서
> **PickPl Facility Tag Scraping & Location-Based Feed Recommendation Design**

본 계획서는 픽플(PickPl) 플랫폼의 핵심 가치인 **"초개인화 공간 발견"**을 극대화하기 위해, 사용자가 원하는 편의시설 정보(콘센트 유무, 화장실 청결도 등)를 효율적으로 수집하고, 브라우저 GPS 위경도 정보를 결합해 "가까운 거리 + 내 취향 무드"의 하이브리드 추천 정렬을 구현하기 위한 설계 계획입니다.

---

## 1. 편의시설 태그 수집 및 크롤링 효율화 전략

무작정 전국 모든 가게를 긁는 것은 속도 저하와 IP 차단(429/403)을 유발하므로, **타겟팅 지역 제한**과 **AI 프롬프트 고도화**를 통해 영리하게 수집을 개시합니다.

### 1.1 수집 범위 타겟팅 (Seed Areas)
* **지역 한정**: 트렌디한 공간이 밀집해 있고 피드 탐색 시 만족도가 높은 서울 4대 핫플레이스로 제한 수집합니다.
  - 망원동 (`mangwon`), 홍대/합정 (`hongdae`, `hapjeong`), 성수동 (`seongsu`), 연남동 (`yeonnam`)
* **카테고리 필터링**: 작업 및 데이트가 주로 일어나는 `카페`, `디저트`, `요리주점`, `브런치` 업종을 최우선으로 수집합니다.

### 1.2 태그 풀 확장 및 AI 추출 지능화
* **태그 풀 확장 (`prompts.py`)**: 유저 요구가 가장 많은 편의시설 태그들을 신규 탑재합니다.
  - `깨끗한화장실` (리뷰 내 "화장실이 청결해요", "내부에 있어요" 검출 시)
  - `의자가편한` (리뷰 내 "의자가 푹신해요", "오래 앉아있기 좋아요" 검출 시)
  - `주차가능` (리뷰 내 "주차 공간이 넓어요", "주차하기 편해요" 검출 시)
* **Gemini 시스템 프롬프트 고도화**:
  - 유저 리뷰 텍스트 중에서 콘센트 여부, 화장실 상태, 의자 및 테이블 편의성을 특별히 주의 깊게 스캔하도록 `SYSTEM_PROMPT`를 수정합니다.

---

## 2. 사용자 위치 기반 하이브리드 추천 피드 정렬 모델

사용자 메인 발견(Explore) 탭에서 개인 맞춤형 피드를 보여줄 때, 취향 무드 유사도 점수와 **사용자의 현재 실시간 거리 점수**를 결합하여 추천 랭킹을 매깁니다.

### 2.1 하이브리드 추천 스코어링 공식 (Hybrid Score Model)
사용자의 기기 위치(GPS) 정보 수집 동의 여부에 따라 랭킹 점수 공식을 이원화(폴백)합니다.

#### A. 위치 정보가 존재하는 경우 (GPS Allowed)
$$CombinedScore = W_{mood} \cdot (MoodScore) + W_{dist} \cdot (DistanceScore)$$
* **무드 점수 ($MoodScore$)**: 사용자의 최근 찜/방문 취향과 장소 태그 간의 Cosine Similarity ($0.0 \sim 1.0$)
* **거리 점수 ($DistanceScore$)**: 사용자와 장소 사이의 실제 물리적 거리에 기반한 감쇄 스코어 ($0.0 \sim 1.0$)
* **가중치**: $W_{mood} = 0.60$, $W_{dist} = 0.40$ (취향을 우선하되 가까울수록 보정치 적용)

#### B. 위치 정보가 없거나 거부된 경우 (GPS Denied / Null Fallback)
$$CombinedScore = MoodScore$$
* 브라우저에서 위치 정보 팝업창을 거절하거나 디바이스 GPS 수신이 안 될 경우, 거리 보정 항($W_{dist} \cdot DistanceScore$)을 생략하고 오직 **개인 무드 매칭률(MoodScore)**이 가장 높은 순서대로 피드를 정렬하여 매끄러운 사용자 경험을 유지합니다.

### 2.2 거리 감쇄 함수 (Distance Decay Function)
단순한 반경 필터링(예: 5km 바깥은 모두 탈락)은 외곽의 보석 같은 공간을 놓칠 수 있으므로, 거리가 멀어질수록 점수가 자연스럽게 낮아지는 지수 감쇄(Exponential Decay) 함수를 적용합니다.

$$DistanceScore = e^{-\gamma \cdot d}$$
* **$d$**: 사용자와 장소 간의 Haversine 공식 거리 (단위: km)
* **$\gamma$ (감쇄 계수)**: $0.3$으로 지정.
  - 내 근처 (0.5km): $e^{-0.15} \approx 0.86$점 (높은 점수 보정)
  - 걸어서 이동 가능 (1.5km): $e^{-0.45} \approx 0.63$점
  - 차/대중교통 이동 (5km): $e^{-1.5} \approx 0.22$점 (자연스럽게 하위 랭크)

---

## 3. 시스템 아키텍처 및 데이터 흐름

```
[ Next.js Frontend ] 
  │ 
  │ 1. navigator.geolocation.getCurrentPosition() 호출
  │    - 허용 시: lat, lon 획득
  │    - 거부/오류 시: lat=null, lon=null
  │ 
  ▼ 2. GET /api/v1/places/recommendations?lat=37.55&lon=126.92
[ Spring Boot Backend ]
  │ 
  │ 3. 사용자 취향 태그 프로필 추출 (Bearer Token 파싱)
  │ 4. MySQL에서 장소 데이터 및 위경도 조회
  │ 5. lat/lon 존재 여부에 따라 하이브리드 스코어링 수행
  │    - Geolocation 존재: Haversine 거리 계산 -> DistanceScore 산출 -> 합산 정렬
  │    - Geolocation 부재: 오직 Vibe/Mood Similarity 점수로만 정렬
  │ 
  ▼ 6. 정렬된 피드 카드 데이터 반환 (JSON)
[ Next.js Frontend ]
```

---

## 4. 구체적인 구현 단계별 변경 대상 파일

### 1단계: 파이썬 수집 및 태그 엔진 고도화
* **[MODIFY] [prompts.py](file:///c:/Users/Silok/Downloads/myProject/pickpl/data-pipeline/analyzer/prompts.py)**:
  - `RECOMMENDED_TAGS` 풀에 `"깨끗한화장실"`, `"주차가능"`, `"의자가편한"` 추가
  - `SYSTEM_PROMPT` 지침에 "리뷰 속 화장실 상태, 주차 편의, 좌석 푹신함, 콘센트 존재 등을 상세히 식별하라"는 가이드 문장 보강
* **E2E 수집기 검증**:
  - `make pipe-analyze` 실행을 통해 콘센트나 화장실 관련 묘사가 담긴 실제 리뷰를 가진 가게들이 신규 편의시설 태그들을 올바르게 부여받는지 로컬 캐시 JSON 분석 검증.

### 2단계: 백엔드 스프링 추천 API 고도화
* **[MODIFY] [PlaceController.java](file:///c:/Users/Silok/Downloads/myProject/pickpl/backend/src/main/java/com/pickpl/app/place/PlaceController.java)**:
  - `recommendations` API 엔드포인트 파라미터에 `@RequestParam(required = false) Double lat, @RequestParam(required = false) Double lon` 추가 수용.
* **[MODIFY] [PlaceService.java](file:///c:/Users/Silok/Downloads/myProject/pickpl/backend/src/main/java/com/pickpl/app/place/service/PlaceService.java)**:
  - 사용자의 프로필 벡터와 개별 장소의 위경도 정보를 기반으로 `lat`, `lon`이 유효할 때 Haversine 공식을 사용해 실시간 거리를 산출하고, 감쇄 계수($e^{-0.3 \cdot d}$)가 적용된 랭킹 정렬 로직 추가.

### 3단계: 프론트엔드 연동 및 위치 권한 핸들링
* **[MODIFY] [ExploreView.tsx](file:///c:/Users/Silok/Downloads/myProject/pickpl/frontend/components/views/ExploreView.tsx)**:
  - 컴포넌트 마운트 시 `navigator.geolocation` 권한 요청을 띄우고, 승인 시 위경도 데이터를 상태 값(`userLocation`)에 저장.
  - 백엔드 추천 API 요청 시 위경도를 파라미터에 담아 호출하고, 거부당했을 때는 null 파라미터로 정상 호출되도록 프론트 방어 로직 구현.
