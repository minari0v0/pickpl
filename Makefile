# 백그라운드에서 Docker (MySQL, Redis) 실행
up:
	docker-compose up -d

# Docker 컨테이너 종료 및 삭제
down:
	docker-compose down

# Docker 컨테이너 중지 (삭제 X)
stop:
	docker-compose stop

# Docker 컨테이너 재시작
restart:
	docker-compose restart

# 프론트엔드 (Next.js) 로컬 서버 실행
front:
	cd frontend && npm run dev

# 백엔드 (Spring Boot) 로컬 서버 실행
back:
	@chcp 65001 > nul && cd backend && .\gradlew.bat bootRun

# 도커 DB 로그 실시간 확인
logs:
	docker-compose logs -f

# 파이프라인 가상환경 구축 및 패키지 설치 (Windows 기준)
pipe-setup:
	cd data-pipeline && python -m venv .venv
	cd data-pipeline && .venv\Scripts\python -m pip install --upgrade pip
	cd data-pipeline && .venv\Scripts\pip install -r requirements.txt
	cd data-pipeline && .venv\Scripts\playwright install

# 1단계: 네이버 플레이스 크롤링 수집 전용 (No AI)
# 예: make pipe-scrape QUERY="홍대 카페" LIMIT=3
SOURCE ?= naver
LIMIT ?= 3
FILE ?=
DELAY ?= 5
DELAY_RANDOM ?=

pipe-scrape:
	@set PYTHONUTF8=1&& cd data-pipeline && .venv\Scripts\python main.py --scrape --query "$(QUERY)" --source $(SOURCE) --limit $(LIMIT) $(if $(FILE),--file "$(FILE)",) --delay $(DELAY) $(if $(DELAY_RANDOM),--delay-random,)

# regions.json 내 전체 지역 x 6대 키워드 자동 일괄 순회 크롤링
pipe-scrape-all:
	@set PYTHONUTF8=1&& cd data-pipeline && .venv\Scripts\python main.py --scrape --query-all --source $(SOURCE) --limit $(LIMIT) $(if $(FILE),--file "$(FILE)",) --delay $(DELAY) $(if $(DELAY_RANDOM),--delay-random,)

# 특정 지역(REGION) 및 카테고리(CATEGORY) 매트릭스 1건 핀포인트 크롤링
pipe-scrape-matrix:
	@set PYTHONUTF8=1&& cd data-pipeline && .venv\Scripts\python main.py --scrape --region "$(REGION)" --category "$(CATEGORY)" --source $(SOURCE) --limit $(LIMIT) $(if $(FILE),--file "$(FILE)",) --delay $(DELAY) $(if $(DELAY_RANDOM),--delay-random,)

# 2단계: Gemini AI 감성/카테고리 분석 전용 (Resume 지원)
# 예: make pipe-ai-analyze FILE=2026-06-10
pipe-ai-analyze:
	@set PYTHONUTF8=1&& cd data-pipeline && .venv\Scripts\python main.py --analyze $(if $(FILE),--file "$(FILE)",)

# 3단계: analyzed_places.json 검토 완료 후 백엔드 DB 주입
pipe-load:
	cd data-pipeline && .venv\Scripts\python main.py --load $(if $(FILE),--file "$(FILE)",)

# AI 분석 실패(429) 복구용 백필 수행
pipe-backfill:
	@set PYTHONUTF8=1&& cd data-pipeline && .venv\Scripts\python backfill.py $(if $(FILE),--file "$(FILE)",)

# 통합: 1단계 크롤링 수집 + 2단계 AI 분석 순차 실행
# 예: make pipe-all QUERY="홍대 카페" LIMIT=3
pipe-all:
	@make pipe-scrape QUERY="$(QUERY)" LIMIT=$(LIMIT) FILE="$(FILE)" DELAY=$(DELAY) DELAY_RANDOM=$(DELAY_RANDOM)
	@make pipe-ai-analyze FILE="$(FILE)"

# 통합: 전체 지역 일괄 크롤링 수집 + AI 분석 순차 실행
pipe-all-run:
	@make pipe-scrape-all LIMIT=$(LIMIT) FILE="$(FILE)" DELAY=$(DELAY) DELAY_RANDOM=$(DELAY_RANDOM)
	@make pipe-ai-analyze FILE="$(FILE)"