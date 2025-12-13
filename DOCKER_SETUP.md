# Docker 로컬 테스트 가이드

GCP에 배포하기 전에 로컬에서 Docker로 테스트하는 방법입니다.

---

## 🐳 로컬 Docker 환경 테스트

### 1. 환경 변수 설정

`.env` 파일이 이미 생성되어 있습니다:

```env
POSTGRES_DB=canvasearth
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
VITE_API_URL=http://localhost:8080
```

### 2. Docker Compose로 실행

```bash
# 모든 서비스 빌드 및 시작
docker compose up -d --build

# 로그 확인
docker compose logs -f
```

### 3. 접속 확인

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **Swagger**: http://localhost:8080/swagger-ui.html

### 4. 중지 및 정리

```bash
# 서비스 중지
docker compose down

# 볼륨까지 삭제 (데이터베이스 초기화)
docker compose down -v

# 오래된 이미지 정리
docker image prune -f
```

---

## 🔧 문제 해결

### 빌드 실패 시

```bash
# 캐시 없이 재빌드
docker compose build --no-cache

# 특정 서비스만 재빌드
docker compose build --no-cache backend
docker compose build --no-cache frontend
```

### 포트 충돌 시

이미 로컬에서 서비스가 실행 중이라면:

**Windows:**
```bash
# 포트 사용 프로세스 확인
netstat -ano | findstr :5173
netstat -ano | findstr :8080

# 프로세스 종료
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# 포트 사용 프로세스 확인
lsof -i :5173
lsof -i :8080

# 프로세스 종료
kill -9 <PID>
```

---

## 📊 Docker 명령어 참고

```bash
# 컨테이너 상태 확인
docker compose ps

# 로그 확인
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# 컨테이너 재시작
docker compose restart

# 컨테이너 내부 접속
docker exec -it canvasearth-backend sh
docker exec -it canvasearth-frontend sh
docker exec -it canvasearth-db psql -U postgres

# 리소스 사용량 확인
docker stats
```

---

## ✅ 로컬 테스트 완료 후

로컬에서 정상 동작이 확인되면, `GCP_DEPLOYMENT.md`를 참고하여 GCP에 배포하세요.
