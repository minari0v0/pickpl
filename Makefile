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

# 크롤링 및 Gemini 감성 분석 수행 (QUERY 및 SOURCE 지정 가능)
# 예: make pipe-analyze QUERY="홍대 카페" SOURCE=kakao
SOURCE ?= naver
pipe-analyze:
	@set PYTHONUTF8=1&& cd data-pipeline && .venv\Scripts\python main.py --analyze --query "$(QUERY)" --source $(SOURCE)

# analyzed_places.json 검토 완료 후 백엔드 DB 주입
pipe-load:
	cd data-pipeline && .venv\Scripts\python main.py --load