# Docker 기반 서버 구축 가이드

GitHub에서 프로젝트를 클론하여 Docker로 전체 스택을 구축하는 완전한 가이드입니다.

---

## 📋 목차

1. [시스템 요구사항](#-시스템-요구사항)
2. [프로젝트 클론 및 초기 설정](#-프로젝트-클론-및-초기-설정)
3. [환경 변수 설정](#-환경-변수-설정)
4. [Docker로 전체 스택 실행](#-docker로-전체-스택-실행)
5. [서비스 확인 및 접속](#-서비스-확인-및-접속)
6. [문제 해결](#-문제-해결)
7. [서비스 관리 명령어](#-서비스-관리-명령어)
8. [보안 주의사항](#-보안-주의사항)
9. [프로덕션 배포](#-프로덕션-배포)

---

## 🖥️ 시스템 요구사항

### 필수 소프트웨어

- **Docker**: 20.10.0 이상
- **Docker Compose**: v2.0.0 이상 (Docker Desktop에 포함)
- **Git**: 최신 버전 권장

### 권장 시스템 사양

**로컬 개발 환경:**
- CPU: 2 코어 이상
- RAM: 4GB 이상
- 디스크: 10GB 이상 여유 공간

**프로덕션 환경:**
- CPU: 4 코어 이상
- RAM: 8GB 이상
- 디스크: 50GB 이상 여유 공간

### Docker 설치 확인

```bash
# Docker 버전 확인
docker --version
# 출력 예시: Docker version 24.0.7, build afdd53b

# Docker Compose 버전 확인
docker compose version
# 출력 예시: Docker Compose version v2.23.0

# Docker 데몬 실행 확인
docker ps
```

---

## 📦 프로젝트 클론 및 초기 설정

### 1. GitHub에서 프로젝트 클론

```bash
# 프로젝트 클론
git clone https://github.com/YOUR_USERNAME/CanvasEarth.git

# 프로젝트 디렉토리로 이동
cd CanvasEarth

# 브랜치 확인
git branch
# main 브랜치에 있는지 확인
```

### 2. 프로젝트 구조 확인

```bash
# 디렉토리 구조 확인
ls -la

# 다음 파일/폴더가 존재해야 합니다:
# - backend/          (Spring Boot 백엔드)
# - frontend/         (React 프론트엔드)
# - docker-compose.yml
# - .env.example
# - README.md
```

---

## 🔐 환경 변수 설정

### 1. .env 파일 생성

```bash
# .env.example을 .env로 복사
cp .env.example .env
```

### 2. .env 파일 편집

**로컬 개발 환경 (.env):**

```bash
# 텍스트 에디터로 .env 파일 열기 (nano, vim, vscode 등)
nano .env
```

```env
# ========================================
# Database Configuration
# ========================================
POSTGRES_DB=canvasearth
POSTGRES_USER=postgres
# 🔒 SECURITY: 강력한 비밀번호로 변경하세요!
POSTGRES_PASSWORD=your-secure-password-here

# ========================================
# API Configuration
# ========================================
# 로컬 개발: http://localhost:8080
# 프로덕션: http://your-server-ip:8080 또는 https://your-domain.com
VITE_API_URL=http://localhost:8080

# ========================================
# CORS Configuration
# ========================================
# 허용할 프론트엔드 Origin 목록
ALLOWED_ORIGIN_1=http://localhost:5173  # Vite dev server
ALLOWED_ORIGIN_2=http://localhost:3000  # 대체 포트
ALLOWED_ORIGIN_3=http://localhost:80    # Docker frontend

# 프로덕션 환경에서는 실제 도메인으로 변경:
# ALLOWED_ORIGIN_1=https://yourdomain.com
# ALLOWED_ORIGIN_2=http://your-server-ip

# ========================================
# Spring Profile
# ========================================
# dev: 개발 환경 (상세한 로깅, H2 콘솔 등)
# prod: 프로덕션 환경 (최적화된 설정)
SPRING_PROFILES_ACTIVE=dev

# ========================================
# GCP Configuration (Optional)
# ========================================
# GCP에 배포 시 필요 (파일 업로드용 Cloud Storage)
# GCP_PROJECT_ID=your-project-id
# GCP_STORAGE_BUCKET=canvasearth-uploads
# GCP_CREDENTIALS_PATH=/secrets/gcp-key.json
```

### 3. 비밀번호 보안

**⚠️ 중요:**
- `POSTGRES_PASSWORD`는 반드시 강력한 비밀번호로 변경
- `.env` 파일은 절대 Git에 커밋하지 않음 (`.gitignore`에 포함됨)
- 프로덕션 환경에서는 Docker Secrets 또는 환경 변수 관리 도구 사용 권장

**강력한 비밀번호 생성 (Linux/Mac):**

```bash
# 랜덤 비밀번호 생성 (32자)
openssl rand -base64 32
```

---

## 🐳 Docker로 전체 스택 실행

### 서비스 구성

Docker Compose로 다음 4개의 서비스가 자동으로 실행됩니다:

1. **PostgreSQL + PostGIS** - 데이터베이스 (포트: 내부만 접근)
2. **RabbitMQ + STOMP** - 메시지 브로커 (WebSocket용, 포트: 5672, 15672, 61613)
3. **Backend (Spring Boot)** - REST API 서버 (포트: 8080)
4. **Frontend (React + Nginx)** - 웹 애플리케이션 (포트: 80)

### 1. 전체 스택 빌드 및 실행

```bash
# 모든 서비스 빌드 및 백그라운드 실행
docker compose up -d --build

# 출력 예시:
# [+] Running 4/4
#  ✔ Container canvasearth-db        Started
#  ✔ Container canvasearth-rabbitmq  Started
#  ✔ Container canvasearth-backend   Started
#  ✔ Container canvasearth-frontend  Started
```

**옵션 설명:**
- `-d`: detached mode (백그라운드 실행)
- `--build`: 이미지 재빌드 (소스 코드 변경 시 필요)

### 2. 로그 확인

```bash
# 모든 서비스 로그 실시간 확인
docker compose logs -f

# 특정 서비스만 확인
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose logs -f rabbitmq

# 마지막 50줄만 확인
docker compose logs --tail=50 backend
```

### 3. 서비스 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker compose ps

# 출력 예시:
# NAME                    STATUS         PORTS
# canvasearth-backend     Up 2 minutes   0.0.0.0:8080->8080/tcp
# canvasearth-db          Up 2 minutes
# canvasearth-frontend    Up 2 minutes   0.0.0.0:80->80/tcp
# canvasearth-rabbitmq    Up 2 minutes   0.0.0.0:5672->5672/tcp, 15672/tcp
```

### 4. Health Check 확인

```bash
# Backend health check
curl http://localhost:8080/actuator/health

# 출력: {"status":"UP"}
```

---

## 🌐 서비스 확인 및 접속

### 접속 URL

| 서비스 | URL | 설명 |
|--------|-----|------|
| **Frontend** | http://localhost | React 애플리케이션 (Nginx) |
| **Backend API** | http://localhost:8080 | REST API 서버 |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | API 문서 |
| **RabbitMQ Management** | http://localhost:15672 | 메시지 큐 관리 콘솔 (guest/guest) |
| **PostgreSQL** | `localhost:5432` | DB (외부 노출 안 됨, 컨테이너 내부만 접근) |

### 브라우저에서 테스트

1. **Frontend 접속**: http://localhost
   - 무한 캔버스 화면이 나타나야 함
   - 툴바에서 텍스트/이미지/YouTube 추가 가능

2. **API 테스트**: http://localhost:8080/swagger-ui.html
   - Swagger UI에서 API 엔드포인트 확인
   - `GET /api/objects` 테스트 실행

3. **RabbitMQ 확인**: http://localhost:15672
   - 사용자명/비밀번호: `guest` / `guest`
   - Connections 탭에서 WebSocket 연결 확인

### 기능 테스트

```bash
# 1. 오브젝트 생성 테스트
curl -X POST http://localhost:8080/api/objects \
  -H "Content-Type: application/json" \
  -d '{
    "objectType": "TEXT",
    "contentUrl": "Hello Docker!",
    "positionX": 100,
    "positionY": 100,
    "width": 200,
    "height": 100
  }'

# 2. 오브젝트 조회 테스트
curl "http://localhost:8080/api/objects?minX=0&minY=0&maxX=1000&maxY=1000"

# 3. Health check
curl http://localhost:8080/actuator/health
```

---

## 🔧 문제 해결

### 1. 컨테이너가 시작되지 않는 경우

**증상:** `docker compose up` 실패 또는 컨테이너가 계속 재시작

**해결 방법:**

```bash
# 1. 모든 컨테이너 중지 및 제거
docker compose down

# 2. 볼륨까지 삭제 (데이터 초기화)
docker compose down -v

# 3. 캐시 없이 재빌드
docker compose build --no-cache

# 4. 다시 시작
docker compose up -d

# 5. 로그 확인
docker compose logs -f
```

### 2. 포트 충돌 (Address already in use)

**증상:** `bind: address already in use` 에러

**해결 방법:**

**Windows:**
```bash
# 포트 사용 프로세스 확인
netstat -ano | findstr :80
netstat -ano | findstr :8080
netstat -ano | findstr :5432

# 프로세스 종료 (PID 확인 후)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# 포트 사용 프로세스 확인
sudo lsof -i :80
sudo lsof -i :8080
sudo lsof -i :5432

# 프로세스 종료
sudo kill -9 <PID>

# 또는 특정 포트의 모든 프로세스 종료
sudo fuser -k 8080/tcp
```

**대체 방법: 포트 변경**

`docker-compose.yml` 파일에서 포트 매핑 변경:

```yaml
services:
  frontend:
    ports:
      - "3000:80"  # 80 대신 3000 사용
  backend:
    ports:
      - "8081:8080"  # 8080 대신 8081 사용
```

### 3. 빌드 실패 (Backend Gradle 에러)

**증상:** Backend 빌드 중 Gradle 에러

**해결 방법:**

```bash
# 1. Gradle wrapper 권한 부여 (Linux/Mac)
chmod +x backend/gradlew

# 2. Gradle 캐시 삭제
rm -rf backend/.gradle
rm -rf backend/build

# 3. 재빌드
docker compose build --no-cache backend
docker compose up -d backend
```

### 4. 빌드 실패 (Frontend npm 에러)

**증상:** Frontend 빌드 중 npm 에러

**해결 방법:**

```bash
# 1. node_modules 삭제
rm -rf frontend/node_modules
rm -rf frontend/package-lock.json

# 2. 재빌드
docker compose build --no-cache frontend
docker compose up -d frontend
```

### 5. PostgreSQL 연결 실패

**증상:** Backend 로그에 `Connection refused` 또는 `Authentication failed`

**해결 방법:**

```bash
# 1. PostgreSQL 컨테이너 상태 확인
docker compose ps postgres

# 2. PostgreSQL 로그 확인
docker compose logs postgres

# 3. .env 파일의 비밀번호 확인
cat .env | grep POSTGRES_PASSWORD

# 4. 데이터베이스 재시작
docker compose restart postgres

# 5. 그래도 안 되면 볼륨 삭제 후 재시작
docker compose down -v
docker compose up -d
```

### 6. RabbitMQ 연결 실패

**증상:** WebSocket 연결 안 됨, Backend 로그에 RabbitMQ 에러

**해결 방법:**

```bash
# 1. RabbitMQ 컨테이너 상태 확인
docker compose ps rabbitmq

# 2. RabbitMQ 로그 확인
docker compose logs rabbitmq

# 3. STOMP 플러그인 활성화 확인
docker exec -it canvasearth-rabbitmq rabbitmq-plugins list

# 4. RabbitMQ 재시작
docker compose restart rabbitmq
```

### 7. Frontend에서 API 호출 실패 (CORS 에러)

**증상:** 브라우저 콘솔에 CORS policy 에러

**해결 방법:**

```bash
# 1. .env 파일의 ALLOWED_ORIGIN 확인
cat .env | grep ALLOWED_ORIGIN

# 2. Frontend가 접속하는 URL을 ALLOWED_ORIGIN에 추가
# 예: http://localhost, http://localhost:80, http://your-ip

# 3. .env 수정 후 Backend 재시작
docker compose restart backend
```

### 8. 디스크 공간 부족

**증상:** `no space left on device` 에러

**해결 방법:**

```bash
# 1. Docker 디스크 사용량 확인
docker system df

# 2. 사용하지 않는 이미지/컨테이너/볼륨 정리
docker system prune -a

# 3. 특정 리소스만 정리
docker image prune -a   # 사용하지 않는 이미지
docker volume prune     # 사용하지 않는 볼륨
docker container prune  # 중지된 컨테이너
```

### 9. 메모리 부족

**증상:** 컨테이너가 OOMKilled 상태로 종료됨

**해결 방법:**

```bash
# 1. Docker 메모리 사용량 확인
docker stats

# 2. Docker Desktop 메모리 제한 증가
# Docker Desktop → Settings → Resources → Memory 설정

# 3. docker-compose.yml에 메모리 제한 추가
services:
  backend:
    mem_limit: 1g
  frontend:
    mem_limit: 512m
```

---

## 📚 서비스 관리 명령어

### 기본 명령어

```bash
# 전체 서비스 시작
docker compose up -d

# 전체 서비스 중지 (컨테이너 제거)
docker compose down

# 전체 서비스 중지 (볼륨까지 제거 - 데이터 삭제!)
docker compose down -v

# 특정 서비스만 재시작
docker compose restart backend
docker compose restart frontend

# 특정 서비스만 재빌드 및 재시작
docker compose up -d --build backend

# 모든 서비스 재빌드 (캐시 사용 안 함)
docker compose build --no-cache
```

### 로그 및 모니터링

```bash
# 실시간 로그 확인
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f backend

# 마지막 N줄만 출력
docker compose logs --tail=100 backend

# 타임스탬프 포함
docker compose logs -f -t backend

# 리소스 사용량 실시간 모니터링
docker stats

# 특정 컨테이너만 모니터링
docker stats canvasearth-backend canvasearth-frontend
```

### 컨테이너 내부 접속

```bash
# Backend 컨테이너 쉘 접속
docker exec -it canvasearth-backend sh

# Frontend 컨테이너 쉘 접속
docker exec -it canvasearth-frontend sh

# PostgreSQL 데이터베이스 접속
docker exec -it canvasearth-db psql -U postgres -d canvasearth

# RabbitMQ 컨테이너 접속
docker exec -it canvasearth-rabbitmq sh
```

### 데이터베이스 관리

```bash
# PostgreSQL 접속
docker exec -it canvasearth-db psql -U postgres -d canvasearth

# SQL 쿼리 실행 예시:
# \dt              - 테이블 목록
# SELECT * FROM canvas_objects;
# \q               - 종료

# 데이터베이스 백업
docker exec canvasearth-db pg_dump -U postgres canvasearth > backup.sql

# 데이터베이스 복원
cat backup.sql | docker exec -i canvasearth-db psql -U postgres -d canvasearth
```

### 빌드 및 배포

```bash
# 특정 서비스만 빌드
docker compose build backend
docker compose build frontend

# 빌드 후 즉시 시작
docker compose up -d --build

# 빌드 진행 상황 상세 출력
docker compose build --progress=plain

# 병렬 빌드 (멀티 코어 활용)
docker compose build --parallel
```

---

## 🔒 보안 주의사항

### 1. PostgreSQL 포트 보안

**현재 설정:** PostgreSQL 포트(5432)는 외부에 노출되지 않습니다.

```yaml
# docker-compose.yml
services:
  postgres:
    # ports 섹션이 주석 처리됨 - 외부 접근 불가
    # ports:
    #   - "5432:5432"  # DISABLED for security
```

**로컬 개발 시 DB 접속이 필요한 경우:**

```bash
# SSH 터널 사용 (프로덕션 서버)
ssh -L 5432:localhost:5432 user@your-server

# 또는 docker exec 사용
docker exec -it canvasearth-db psql -U postgres -d canvasearth
```

### 2. 환경 변수 관리

- `.env` 파일은 **절대 Git에 커밋하지 않기** (`.gitignore`에 포함됨)
- 프로덕션 환경에서는 강력한 비밀번호 사용
- 가능하면 Docker Secrets 또는 AWS Secrets Manager 사용

```bash
# .env 파일 권한 제한 (Linux/Mac)
chmod 600 .env
```

### 3. CORS 설정

프로덕션 환경에서는 `.env` 파일의 `ALLOWED_ORIGIN`을 실제 도메인으로 제한:

```env
# ❌ 잘못된 설정 (모든 Origin 허용)
ALLOWED_ORIGIN_1=*

# ✅ 올바른 설정 (특정 도메인만 허용)
ALLOWED_ORIGIN_1=https://yourdomain.com
ALLOWED_ORIGIN_2=https://www.yourdomain.com
```

### 4. Spring Profile

```env
# 개발 환경
SPRING_PROFILES_ACTIVE=dev

# 프로덕션 환경 (최적화된 로깅, 보안 강화)
SPRING_PROFILES_ACTIVE=prod
```

### 5. Nginx 보안 헤더

Frontend의 `nginx.conf`에 이미 보안 헤더가 설정되어 있습니다:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
server_tokens off;
```

---

## 🚀 프로덕션 배포

### GCP (Google Cloud Platform) 배포

프로덕션 배포는 `GCP_DEPLOYMENT.md` 파일을 참고하세요.

**주요 차이점:**

| 항목 | 로컬 개발 | GCP 프로덕션 |
|------|-----------|--------------|
| **VITE_API_URL** | `http://localhost:8080` | `http://YOUR_IP:8080` |
| **ALLOWED_ORIGIN** | `http://localhost:5173` | `http://YOUR_IP` |
| **SPRING_PROFILES_ACTIVE** | `dev` | `prod` |
| **POSTGRES_PASSWORD** | 간단한 비밀번호 | 강력한 비밀번호 (32자+) |
| **PostgreSQL 포트** | 내부만 접근 | 내부만 접근 (절대 노출 금지) |

### Docker 이미지 최적화

프로덕션 배포 전 이미지 크기 최적화:

```bash
# 멀티 스테이지 빌드로 이미지 크기 확인
docker images | grep canvasearth

# 불필요한 레이어 제거
docker compose build --no-cache

# 이미지 압축 및 최적화
docker image prune -a
```

---

## 📝 체크리스트

### 초기 설정 체크리스트

- [ ] Docker 및 Docker Compose 설치 확인
- [ ] GitHub에서 프로젝트 클론
- [ ] `.env.example` → `.env` 복사
- [ ] `.env` 파일에서 `POSTGRES_PASSWORD` 변경
- [ ] `.env` 파일 권한 설정 (`chmod 600 .env`)
- [ ] `docker compose up -d --build` 실행
- [ ] http://localhost 접속 확인
- [ ] http://localhost:8080/swagger-ui.html 접속 확인
- [ ] RabbitMQ Management (http://localhost:15672) 접속 확인

### 배포 전 체크리스트

- [ ] `.env` 파일에 강력한 비밀번호 설정
- [ ] `VITE_API_URL`을 실제 서버 주소로 변경
- [ ] `ALLOWED_ORIGIN`을 실제 도메인으로 변경
- [ ] `SPRING_PROFILES_ACTIVE=prod` 설정
- [ ] PostgreSQL 포트가 외부에 노출되지 않는지 확인
- [ ] Docker 이미지 최적화 및 빌드
- [ ] Health check 엔드포인트 테스트
- [ ] 방화벽 규칙 설정 (필요한 포트만 열기)

---

## 🆘 추가 지원

### 문제 발생 시

1. **TROUBLESHOOTING.md** 파일 확인 - 이전 문제 해결 사례
2. **로그 확인**: `docker compose logs -f`
3. **GitHub Issues** 등록

### 유용한 리소스

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Spring Boot Docker 가이드](https://spring.io/guides/gs/spring-boot-docker/)
- [Nginx Docker 가이드](https://hub.docker.com/_/nginx)

---

**작성일**: 2025-12-23
**마지막 업데이트**: 2025-12-23
**버전**: 2.0
