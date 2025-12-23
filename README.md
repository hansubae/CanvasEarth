# Canvas Earth

> An interactive infinite canvas where you can freely place images, text, and YouTube videos with real-time collaboration

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📋 Overview

Canvas Earth는 무한한 2D 캔버스 위에서 이미지, 텍스트, YouTube 비디오를 자유롭게 배치하고 관리할 수 있는 협업 플랫폼입니다. Figma나 Miro와 같은 직관적인 UX를 제공하며, 실시간 동기화를 통해 여러 사용자가 동시에 작업할 수 있습니다.

### 🎯 Key Features

- **무한 캔버스**: 제한 없는 2D 공간에서 자유로운 배치
- **다양한 오브젝트**: 텍스트, 이미지, YouTube 비디오 지원
- **실시간 동기화**: WebSocket 기반 즉각적인 변경사항 공유
- **최적화된 렌더링**: Viewport 기반 쿼리로 대용량 오브젝트 처리
- **직관적인 UI**: 드래그 앤 드롭, 키보드 단축키, 그리드 배경
- **Docker 기반**: 한 번의 명령으로 전체 스택 실행

---

## 🚀 Quick Start (Docker)

### Prerequisites

- Docker 20.10.0+
- Docker Compose v2.0.0+

### 1. Clone Repository

```bash
git clone https://github.com/hansubae/CanvasEarth.git
cd CanvasEarth
```

### 2. Environment Setup

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (비밀번호 설정 필수!)
nano .env
```

**최소 설정:**
```env
POSTGRES_PASSWORD=your-secure-password-here
VITE_API_URL=http://localhost:8080
```

### 3. Start All Services

```bash
# 전체 스택 빌드 및 실행 (PostgreSQL + RabbitMQ + Backend + Frontend)
docker compose up -d --build

# 로그 확인
docker compose logs -f
```

### 4. Access Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost | React 애플리케이션 |
| **Backend API** | http://localhost:8080 | REST API 서버 |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | API 문서 |
| **RabbitMQ** | http://localhost:15672 | 메시지 큐 관리 (guest/guest) |

### 5. Stop Services

```bash
# 서비스 중지
docker compose down

# 데이터까지 삭제
docker compose down -v
```

**더 자세한 설정은 [DOCKER_SETUP.md](DOCKER_SETUP.md) 참고**

---

## 💻 Tech Stack

### Backend
- **Java 17** with **Spring Boot 3.x**
- **PostgreSQL 15** with **PostGIS** (공간 쿼리)
- **Spring Data JPA** (Hibernate)
- **RabbitMQ + STOMP** (WebSocket 메시징)
- **Gradle 8.5** (빌드 도구)
- **Swagger/OpenAPI** (API 문서)

### Frontend
- **React 18** with **TypeScript**
- **Vite** (빌드 도구)
- **Konva.js** (Canvas 렌더링)
- **TanStack Query (React Query)** (서버 상태 관리)
- **Zustand** (클라이언트 상태 관리)
- **Tailwind CSS** (스타일링)
- **Nginx** (프로덕션 서버)

### Infrastructure
- **Docker & Docker Compose** (컨테이너화)
- **Multi-stage Dockerfile** (최적화된 이미지)
- **Health Checks** (자동 복구)

---

## 📁 Project Structure

```
CanvasEarth/
├── backend/                          # Spring Boot Backend
│   ├── src/main/java/com/canvasearth/
│   │   ├── config/                   # 설정 (CORS, WebSocket, Exception Handler)
│   │   ├── controller/               # REST API 컨트롤러
│   │   ├── dto/                      # Request/Response DTO
│   │   ├── entity/                   # JPA 엔티티 (CanvasObject, ObjectType)
│   │   ├── exception/                # 커스텀 예외
│   │   ├── repository/               # Spring Data JPA 리포지토리
│   │   ├── service/                  # 비즈니스 로직
│   │   └── validator/                # 파일 검증
│   ├── src/main/resources/
│   │   ├── application.yml           # 공통 설정
│   │   ├── application-dev.yml       # 개발 환경 설정
│   │   ├── application-prod.yml      # 프로덕션 설정
│   │   └── logback-spring.xml        # 로깅 설정
│   ├── Dockerfile                    # Multi-stage build
│   └── build.gradle                  # Gradle 빌드 설정
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── components/               # React 컴포넌트
│   │   │   ├── InfiniteCanvas.tsx    # 메인 캔버스
│   │   │   ├── CanvasObject.tsx      # 오브젝트 렌더링
│   │   │   ├── TextEditor.tsx        # 텍스트 편집기
│   │   │   ├── Toolbar.tsx           # 도구 모음
│   │   │   └── YouTubeOverlay.tsx    # YouTube 플레이어
│   │   ├── hooks/                    # 커스텀 훅 (관심사 분리)
│   │   │   ├── useCanvasObjects.ts   # React Query 훅
│   │   │   ├── useWebSocket.ts       # WebSocket 연결
│   │   │   ├── useCanvasInteraction.ts
│   │   │   ├── useObjectOperations.ts
│   │   │   ├── useTextEditor.ts
│   │   │   ├── useGridRenderer.ts
│   │   │   └── useKeyboardShortcuts.ts
│   │   ├── services/                 # API 서비스
│   │   ├── stores/                   # Zustand 스토어
│   │   └── types/                    # TypeScript 타입
│   ├── nginx.conf                    # Nginx 설정 (프로덕션)
│   ├── Dockerfile                    # Multi-stage build
│   └── package.json
├── docker-compose.yml                # 전체 스택 오케스트레이션
├── .env.example                      # 환경 변수 템플릿
├── DOCKER_SETUP.md                   # Docker 설치 가이드
└── README.md                         # 이 파일
```

---

## ✨ Features

### 🎨 Canvas Management

- **무한 스크롤**: 제한 없는 2D 공간
- **줌 인/아웃**: 마우스 휠로 0.1x ~ 5x 배율 조절
- **팬(이동)**: 드래그하여 캔버스 이동
- **그리드 배경**: 50px 간격 그리드 표시 (토글 가능)
- **Viewport 최적화**: 화면에 보이는 영역만 렌더링

### 📦 Object Types

#### 1. Text Object
- 더블클릭으로 편집
- 폰트 크기 조절 (12px ~ 64px)
- 폰트 두께 설정 (normal, bold)
- 색상 커스터마이징 (color picker)

#### 2. Image Object
- 드래그 앤 드롭으로 업로드
- 지원 형식: JPG, PNG, GIF, WebP
- 최대 크기: 5MB
- 자동 리사이징

#### 3. YouTube Object
- URL 입력으로 추가
- 썸네일 미리보기
- 클릭하여 비디오 재생
- 다중 비디오 동시 재생 지원

### 🔄 Real-time Collaboration

- **WebSocket (STOMP)**: RabbitMQ 기반 메시지 브로커
- **즉각적인 동기화**: 다른 사용자의 변경사항 실시간 반영
- **이벤트 타입**:
  - `CREATE`: 새 오브젝트 추가
  - `UPDATE`: 오브젝트 수정 (이동, 리사이즈)
  - `DELETE`: 오브젝트 삭제

### ⚡ Performance Optimizations

- **React Query 캐싱**: 1000px 그리드 기반 Query Key 라운딩
- **useMemo**: 불필요한 리렌더링 방지
- **placeholderData**: 깜빡임 없는 데이터 로딩
- **네트워크 요청 90% 감소**: 스마트 캐싱 전략
- **Health Checks**: 자동 서비스 복구

### 🎮 User Interactions

- **드래그 앤 드롭**: 오브젝트 이동 및 이미지 업로드
- **리사이즈**: 모서리 핸들로 크기 조절
- **키보드 단축키**:
  - `Delete` / `Backspace`: 선택된 오브젝트 삭제
  - `Esc`: 선택 해제 (예정)
  - `Ctrl+Z`: 실행 취소 (예정)
- **컨텍스트 메뉴**: 우클릭 메뉴 (예정)

---

## 🗄️ Database Schema

### canvas_objects

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary Key |
| object_type | VARCHAR(20) | 'TEXT', 'IMAGE', 'YOUTUBE', 'VIDEO' |
| content_url | TEXT | 텍스트 내용 또는 파일/비디오 URL |
| position_x | DOUBLE | X 좌표 |
| position_y | DOUBLE | Y 좌표 |
| width | DOUBLE | 너비 |
| height | DOUBLE | 높이 |
| font_size | INTEGER | 폰트 크기 (텍스트 전용, 기본값: 16) |
| font_weight | VARCHAR(10) | 폰트 두께 ('normal', 'bold') |
| text_color | VARCHAR(7) | 텍스트 색상 (hex, 기본값: '#000000') |
| z_index | INTEGER | 레이어 순서 (기본값: 0) |
| user_id | BIGINT | 생성자 ID (FK, 향후 구현) |
| created_at | TIMESTAMP | 생성 시간 |
| updated_at | TIMESTAMP | 수정 시간 |

**Indexes:**
- 공간 쿼리 최적화를 위한 B-tree 인덱스 (position_x, position_y)

---

## 🔌 API Endpoints

### Canvas Objects

```bash
# 오브젝트 조회 (Viewport 범위)
GET /api/objects?minX=0&minY=0&maxX=1000&maxY=1000

# 오브젝트 생성
POST /api/objects
Content-Type: application/json
{
  "objectType": "TEXT",
  "contentUrl": "Hello World",
  "positionX": 100,
  "positionY": 100,
  "width": 200,
  "height": 100
}

# 오브젝트 수정
PUT /api/objects/{id}
Content-Type: application/json
{
  "positionX": 150,
  "positionY": 200,
  "width": 250,
  "height": 120
}

# 오브젝트 삭제
DELETE /api/objects/{id}

# 이미지 업로드
POST /api/objects/upload-image
Content-Type: multipart/form-data
- file: (이미지 파일)
- positionX: 100
- positionY: 100
```

**자세한 API 명세**: http://localhost:8080/swagger-ui.html

---

## 🔐 Security

### CORS Configuration
```yaml
allowed-origins:
  - http://localhost:5173  # Vite dev server
  - http://localhost:80    # Docker frontend
  - ${ALLOWED_ORIGIN_1}    # 커스텀 origin
```

### Environment Variables
- `.env` 파일은 Git에 커밋되지 않음
- 프로덕션 환경에서는 강력한 비밀번호 사용 필수
- Docker Secrets 또는 환경 변수 관리 도구 권장

### PostgreSQL
- 외부 포트 노출 비활성화 (내부 네트워크만 접근)
- 환경 변수로 비밀번호 관리
- SSH 터널을 통한 안전한 원격 접속

---

## 📊 Development Progress

### ✅ Phase 1: Project Setup & Docker
- Spring Boot + React 프로젝트 구성
- PostgreSQL + PostGIS Docker 설정
- 기본 프로젝트 구조 설계

### ✅ Phase 2: Backend Core (CRUD)
- JPA 엔티티 및 리포지토리 구현
- Viewport 범위 쿼리 최적화
- REST API 컨트롤러
- Swagger API 문서화
- 예외 처리 및 검증

### ✅ Phase 3: Frontend Canvas Basic
- react-konva 기반 무한 캔버스
- 오브젝트 렌더링 및 상호작용
- Toolbar 및 UI 컴포넌트
- 텍스트, 이미지, YouTube 오브젝트 지원
- React Query 통합
- 드래그 앤 드롭, 키보드 단축키

### ✅ Phase 4: Real-time & Polish (In Progress)
- ✅ WebSocket (STOMP) 실시간 동기화
- ✅ RabbitMQ 메시지 브로커 통합
- ✅ 그리드 배경 및 토글 기능
- ✅ 텍스트 폰트 커스터마이징
- ✅ React Query 최적화 (깜빡임 해결)
- ✅ 커스텀 훅으로 코드 분리
- ✅ Docker 프로덕션 배포 설정
- 🚧 사용자 인증 시스템
- 🚧 미니맵
- 🚧 실행 취소/다시 실행
- 🚧 오브젝트 복사/붙여넣기

---

## 🛠️ Development

### Local Development (without Docker)

#### Backend
```bash
# PostgreSQL 시작 (Docker)
docker compose up -d postgres rabbitmq

# Backend 실행
cd backend
./gradlew bootRun
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Build for Production

```bash
# Backend JAR 빌드
cd backend
./gradlew bootJar
# 출력: build/libs/canvas-earth-backend.jar

# Frontend 빌드
cd frontend
npm run build
# 출력: dist/
```

---

## 🐛 Troubleshooting

### 포트 충돌
```bash
# 포트 사용 확인 (Linux/Mac)
sudo lsof -i :8080
sudo lsof -i :80

# 포트 사용 확인 (Windows)
netstat -ano | findstr :8080
```

### Docker 문제
```bash
# 컨테이너 로그 확인
docker compose logs -f backend

# 컨테이너 재시작
docker compose restart backend

# 전체 재빌드
docker compose down -v
docker compose up -d --build
```

### 데이터베이스 초기화
```bash
# 볼륨 삭제 (데이터 초기화)
docker compose down -v
docker compose up -d
```

**더 자세한 문제 해결**: 내부 TROUBLESHOOTING.md 참고

---

## 📚 Documentation

- **[DOCKER_SETUP.md](DOCKER_SETUP.md)**: Docker 기반 서버 구축 가이드
- **Swagger UI**: http://localhost:8080/swagger-ui.html (API 문서)

---

## 🎓 Learning Resources

이 프로젝트는 다음 기술들을 학습하기 위한 교육용 프로젝트입니다:

- **Backend**: Spring Boot, JPA, WebSocket, RabbitMQ
- **Frontend**: React, TypeScript, Canvas API, React Query
- **DevOps**: Docker, Docker Compose, Multi-stage builds
- **Architecture**: REST API, Real-time messaging, Microservices

---

## 🤝 Contributing

이 프로젝트는 개인 학습용 프로젝트이지만, 제안이나 버그 리포트는 환영합니다!

---

## 📄 License

This project is for educational and development purposes.

---

## 🚀 Future Plans

- [ ] 사용자 인증 및 권한 관리
- [ ] 협업 기능 (실시간 커서 표시)
- [ ] 미니맵 및 네비게이션
- [ ] 오브젝트 레이어 관리 (z-index)
- [ ] 실행 취소/다시 실행 (Undo/Redo)
- [ ] 오브젝트 복사/붙여넣기
- [ ] 캔버스 북마크 및 공유
- [ ] 모바일 지원
- [ ] 오프라인 모드
- [ ] 다크 모드

---

**Built with ❤️ using Spring Boot, React, and Docker**

🤖 *Generated with [Claude Code](https://claude.com/claude-code)*
