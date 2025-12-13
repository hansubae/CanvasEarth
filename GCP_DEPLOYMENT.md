# GCP Compute Engine 배포 가이드

이 가이드는 CanvasEarth 프로젝트를 GCP Compute Engine에 Docker로 배포하는 방법을 설명합니다.

---

## 📋 사전 요구사항

- GCP 계정 및 프로젝트
- gcloud CLI 설치 및 인증
- Git 설치

---

## 🚀 1단계: GCP Compute Engine VM 생성

### 1.1 GCP Console에서 VM 생성

1. **GCP Console** → **Compute Engine** → **VM 인스턴스** 이동
2. **인스턴스 만들기** 클릭

### 1.2 VM 설정

| 항목 | 권장 설정 |
|------|----------|
| **이름** | canvasearth-vm |
| **리전** | asia-northeast3 (서울) |
| **영역** | asia-northeast3-a |
| **머신 유형** | e2-medium (2 vCPU, 4GB 메모리) |
| **부팅 디스크** | Ubuntu 22.04 LTS, 30GB SSD |
| **방화벽** | HTTP, HTTPS 트래픽 허용 체크 |

### 1.3 VM 액세스 (SSH)

```bash
# gcloud CLI로 SSH 접속
gcloud compute ssh canvasearth-vm --zone=asia-northeast3-a
```

또는 GCP Console에서 **SSH** 버튼 클릭

---

## 🔧 2단계: VM에 Docker 설치

### 2.1 시스템 업데이트

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2.2 Docker 설치

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 재로그인 (또는 newgrp docker)
exit
```

다시 SSH로 접속:
```bash
gcloud compute ssh canvasearth-vm --zone=asia-northeast3-a
```

### 2.3 Docker Compose 설치

```bash
# Docker Compose 설치
sudo apt-get install docker-compose-plugin -y

# 버전 확인
docker compose version
```

---

## 📦 3단계: 프로젝트 배포

### 3.1 Git 저장소 클론 (또는 파일 업로드)

**방법 1: Git 저장소에서 클론**

```bash
# Git이 설치되어 있지 않다면
sudo apt-get install git -y

# 저장소 클론
git clone https://github.com/your-username/CanvasEarth.git
cd CanvasEarth
```

**방법 2: 로컬에서 파일 업로드**

```bash
# 로컬 PC에서 실행 (Windows PowerShell 또는 CMD)
gcloud compute scp --recurse D:\CanvasEarth canvasearth-vm:~/ --zone=asia-northeast3-a

# VM에서 확인
cd ~/CanvasEarth
```

### 3.2 환경 변수 설정

```bash
# .env 파일 수정
nano .env
```

**중요**: `VITE_API_URL`을 VM의 외부 IP로 변경

```env
# Database Configuration
POSTGRES_DB=canvasearth
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Frontend Configuration
VITE_API_URL=http://YOUR_VM_EXTERNAL_IP:8080
```

VM의 외부 IP 확인:
```bash
curl ifconfig.me
```

또는 GCP Console에서 확인 가능

---

## 🐳 4단계: Docker Compose로 실행

### 4.1 빌드 및 실행

```bash
# 모든 서비스 빌드 및 시작
docker compose up -d --build
```

### 4.2 로그 확인

```bash
# 전체 로그
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### 4.3 상태 확인

```bash
# 컨테이너 상태
docker compose ps

# 포트 확인
sudo netstat -tlnp | grep -E '5432|8080|5173'
```

---

## 🔥 5단계: 방화벽 규칙 설정

### 5.1 GCP 방화벽 규칙 생성

**GCP Console 방법:**

1. **VPC 네트워크** → **방화벽** → **방화벽 규칙 만들기**
2. 다음 규칙 생성:

| 항목 | 값 |
|------|-----|
| **이름** | allow-canvasearth-frontend |
| **대상** | 네트워크의 모든 인스턴스 |
| **소스 IPv4 범위** | 0.0.0.0/0 |
| **프로토콜 및 포트** | tcp:5173 |

3. **만들기** 클릭

**gcloud CLI 방법:**

```bash
# Frontend 포트 5173 열기
gcloud compute firewall-rules create allow-canvasearth-frontend \
    --allow tcp:5173 \
    --source-ranges 0.0.0.0/0 \
    --description="Allow CanvasEarth Frontend"

# Backend 포트 8080 열기 (선택사항)
gcloud compute firewall-rules create allow-canvasearth-backend \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0 \
    --description="Allow CanvasEarth Backend"
```

---

## 🌐 6단계: 접속 확인

### 6.1 외부 IP 확인

```bash
# VM에서 실행
curl ifconfig.me
```

또는 GCP Console → Compute Engine → VM 인스턴스에서 **외부 IP** 확인

### 6.2 브라우저에서 접속

```
http://YOUR_VM_EXTERNAL_IP:5173
```

---

## 🛠️ 관리 명령어

### 서비스 재시작

```bash
# 전체 재시작
docker compose restart

# 특정 서비스만 재시작
docker compose restart backend
docker compose restart frontend
```

### 서비스 중지

```bash
# 모든 서비스 중지
docker compose down

# 볼륨까지 삭제 (데이터베이스 데이터 포함)
docker compose down -v
```

### 로그 확인

```bash
# 실시간 로그
docker compose logs -f

# 최근 100줄
docker compose logs --tail=100
```

### 컨테이너 내부 접속

```bash
# Backend 컨테이너
docker exec -it canvasearth-backend sh

# Frontend 컨테이너
docker exec -it canvasearth-frontend sh

# PostgreSQL 컨테이너
docker exec -it canvasearth-db psql -U postgres -d canvasearth
```

---

## 🔄 업데이트 배포

### 코드 변경 후 재배포

```bash
# Git으로 최신 코드 가져오기
git pull origin main

# 컨테이너 재빌드 및 재시작
docker compose up -d --build

# 오래된 이미지 정리
docker image prune -f
```

---

## 📊 리소스 모니터링

### 시스템 리소스 확인

```bash
# 디스크 사용량
df -h

# 메모리 사용량
free -h

# Docker 리소스 사용량
docker stats
```

### 디스크 정리

```bash
# 사용하지 않는 Docker 리소스 정리
docker system prune -a --volumes
```

---

## 🔒 보안 권장사항

### 1. PostgreSQL 비밀번호 변경

`.env` 파일에서 강력한 비밀번호 설정:

```env
POSTGRES_PASSWORD=your_very_strong_password_here
```

### 2. 방화벽 규칙 최소화

프로덕션 환경에서는 Backend 포트(8080)를 직접 노출하지 않는 것이 좋습니다.
Frontend에서만 내부 네트워크로 Backend에 접근하도록 설정.

### 3. SSH 키 기반 인증

비밀번호 인증 대신 SSH 키 사용 (GCP 기본값)

### 4. 정기 업데이트

```bash
# 시스템 업데이트
sudo apt-get update && sudo apt-get upgrade -y

# Docker 이미지 업데이트
docker compose pull
docker compose up -d
```

---

## ❗ 문제 해결

### 포트가 이미 사용 중

```bash
# 포트 사용 프로세스 확인
sudo lsof -i :5173
sudo lsof -i :8080

# 프로세스 종료
sudo kill -9 <PID>
```

### 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker compose logs backend
docker compose logs frontend

# 컨테이너 재생성
docker compose down
docker compose up -d --force-recreate
```

### 데이터베이스 연결 오류

```bash
# PostgreSQL 컨테이너 상태 확인
docker compose ps postgres

# 데이터베이스 연결 테스트
docker exec -it canvasearth-db psql -U postgres -c "SELECT 1"
```

### 메모리 부족

VM 머신 유형을 더 큰 것으로 변경:
- GCP Console → Compute Engine → VM 인스턴스 → 중지
- **수정** → 머신 유형 변경 (예: e2-standard-2)
- 시작

---

## 📈 성능 최적화 팁

### 1. 스왑 메모리 추가 (메모리 부족 시)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 설정
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Docker 로그 크기 제한

`docker-compose.yml`에 추가:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🎉 완료!

이제 GCP Compute Engine에서 CanvasEarth가 실행 중입니다.

- **Frontend**: http://YOUR_VM_EXTERNAL_IP:5173
- **Backend API**: http://YOUR_VM_EXTERNAL_IP:8080
- **Swagger**: http://YOUR_VM_EXTERNAL_IP:8080/swagger-ui.html
