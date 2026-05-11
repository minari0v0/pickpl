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
	cd backend && ./gradlew bootRun

# 도커 DB 로그 실시간 확인
logs:
	docker-compose logs -f