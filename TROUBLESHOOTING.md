# 문제 해결 로그 (Troubleshooting Log)

이 파일은 프로젝트 개발 중 발생한 문제와 해결 방법을 기록합니다.

---

## 2025-12-01: YouTube 쇼츠 URL 정규식 캡처 그룹 오류

### 📋 문제 상황
- YouTube 오브젝트가 있는 쪽으로 화면을 드래그하면 화면이 하얀색으로 변함
- Console 에러:
  ```
  Uncaught TypeError: Cannot read properties of undefined (reading 'length')
  The above error occurred in the <YouTubeObject> component
  ```

### 🔍 원인 분석

#### 1. 초기 상태
YouTube 쇼츠 지원을 추가하기 위해 정규식에 `(shorts\/)` 캡처 그룹을 추가:

```typescript
// Before
/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
//                                                               ^^^^^^^^^ match[7]

// After (버그 발생)
/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(shorts\/)|(watch\?))\??v?=?([^#&?]*).*/
//                                              ^^^^^^^^^ 추가             ^^^^^^^^^ match[8]로 이동!
```

#### 2. 문제 발생 메커니즘
- 정규식에서 `()`로 감싸진 부분은 **캡처 그룹**으로, 매칭 결과가 배열의 인덱스로 저장됨
- `(shorts\/)` 그룹 추가로 전체 캡처 그룹 개수가 증가
- 비디오 ID의 위치가 **match[7] → match[8]**로 변경됨
- 코드는 여전히 `match[7].length`를 참조

#### 3. URL별 동작
**일반 비디오** (`https://www.youtube.com/watch?v=dQw4w9WgXcQ`):
```javascript
match[7] = "watch?"        // 패턴 매칭 결과
match[8] = "dQw4w9WgXcQ"   // 비디오 ID
// match[7].length는 6 → 조건 실패 → null 반환
```

**쇼츠 비디오** (`https://www.youtube.com/shorts/abc12345678`):
```javascript
match[7] = undefined       // 매칭된 그룹 없음
match[8] = "abc12345678"   // 비디오 ID
// match[7].length → TypeError: Cannot read properties of undefined
```

### ✅ 해결 방법

**비캡처 그룹 `(?:...)`** 사용으로 인덱스 고정:

```typescript
// Fixed
/^.*(?:youtu\.be\/|v\/|\/u\/\w\/|embed\/|shorts\/|watch\?v=)([^#&?]*).*/
//   ^^^ 비캡처 그룹: 그룹화는 하지만 캡처하지 않음

// 결과: 비디오 ID가 항상 match[1]에 위치
const match = url.match(regExp);
return match && match[1] && match[1].length === 11 ? match[1] : null;
```

**비캡처 그룹의 장점:**
- 패턴 그룹화는 유지하되, 캡처 배열에 포함되지 않음
- 인덱스 번호를 차지하지 않음
- 성능상 약간 더 효율적 (캡처 작업 생략)

### 📁 수정된 파일
- `frontend/src/components/InfiniteCanvas.tsx` (line 13-20)
- `frontend/src/components/CanvasObject.tsx` (line 55-63)

### 🧪 테스트 결과
모든 YouTube URL 형식에서 정상 작동 확인:
- ✅ `youtube.com/watch?v=VIDEO_ID`
- ✅ `youtube.com/shorts/VIDEO_ID`
- ✅ `youtu.be/VIDEO_ID`
- ✅ `youtube.com/embed/VIDEO_ID`

### 📚 교훈
1. 정규식에 새 캡처 그룹을 추가할 때는 기존 인덱스 참조에 영향을 줌
2. 그룹화만 필요하고 값을 캡처할 필요가 없다면 **비캡처 그룹 `(?:...)`** 사용
3. 정규식 변경 후에는 모든 케이스에 대한 테스트 필수

---

## 2025-12-02: TextEditor Save 후 편집 툴이 다시 열리는 문제

### 📋 문제 상황
- TextEditor에서 Save 버튼을 눌렀을 때 편집 툴이 닫히지 않음
- `setEditingText(null)`을 호출했는데도 편집 툴이 바로 다시 나타남

### 🔍 원인 분석

#### 1. 초기 구현
```typescript
const handleTextSave = async (...) => {
  const updated = await canvasApi.updateObject(editingText.id, {...});
  updateObject(editingText.id, updated);
  setEditingText(null); // 편집 툴 닫기
};
```

#### 2. 문제 발생 메커니즘
1. `updateObject()`가 호출되면서 `objects` 배열이 업데이트됨
2. `useEffect`의 dependency에 `objects`가 포함되어 있음
3. `objects` 변경으로 `useEffect` 재실행
4. `selectedObjectId`가 여전히 텍스트 오브젝트 ID를 가리키고 있음
5. 조건문 통과하여 `setEditingText()`가 다시 호출됨
6. 편집 툴이 다시 열림

```typescript
useEffect(() => {
  if (selectedObjectId === null) {
    setEditingText(null);
    return;
  }

  const selectedObject = objects.find(obj => obj.id === selectedObjectId);

  if (selectedObject && selectedObject.objectType === ObjectType.TEXT) {
    setEditingText({ ... }); // 다시 열림!
  }
}, [selectedObjectId, objects]); // objects 변경으로 재실행
```

### ✅ 해결 방법

Save/Cancel 시 선택을 해제하여 `useEffect`가 다시 실행되어도 편집 툴이 열리지 않도록 수정:

```typescript
const handleTextSave = async (text: string, fontSize: number, fontWeight: string, textColor: string) => {
  if (!editingText) return;

  try {
    const updated = await canvasApi.updateObject(editingText.id, {
      contentUrl: text,
      fontSize,
      fontWeight,
      textColor,
    });
    updateObject(editingText.id, updated);
    // 선택 해제로 편집 툴이 다시 열리지 않도록 함
    setSelectedObjectId(null);
    setEditingText(null);
  } catch (error) {
    console.error('Failed to update text:', error);
  }
};

const handleTextCancel = () => {
  setSelectedObjectId(null);
  setEditingText(null);
};
```

### 📁 수정된 파일
- `frontend/src/components/InfiniteCanvas.tsx` (line 423-449)
  - `handleTextSave`: `setSelectedObjectId(null)` 추가
  - `handleTextCancel`: `setSelectedObjectId(null)` 추가

### 🧪 테스트 결과
- ✅ Save 버튼 클릭 시 편집 툴이 즉시 닫힘
- ✅ Cancel 버튼 클릭 시 편집 툴이 즉시 닫힘
- ✅ Esc 키로도 정상 동작
- ✅ 편집 툴이 다시 열리지 않음

### 📚 교훈
1. `useEffect`의 dependency를 명확히 이해해야 함
2. State 업데이트 순서가 중요함 (선택 해제 → 편집 툴 닫기)
3. React의 re-render 사이클을 고려한 설계 필요
4. 컴포넌트 간 상태 의존성을 최소화해야 함

---

## 2025-12-03: YouTube 재생 중 크기 조절 동기화 문제 (4가지 연관 문제)

### 📋 문제 상황 1: 재생 중 크기 조절 시 썸네일과 영상 불일치
- YouTube 오브젝트 재생 중 크기를 조절하면 썸네일 크기만 변경됨
- 재생 중인 영상(iframe)은 원래 크기 유지
- 특히 왼쪽/위쪽 핸들로 조절 시 위치도 어긋남

### 🔍 원인 분석 1

#### 초기 구조의 문제
```typescript
// playingVideos 배열 (이전)
const [playingVideos, setPlayingVideos] = useState<Array<{
  id: string;
  videoId: string;
  canvasX: number;     // ❌ 재생 시작 시점의 고정값
  canvasY: number;     // ❌ 재생 시작 시점의 고정값
  width: number;       // ❌ 재생 시작 시점의 고정값
  height: number;      // ❌ 재생 시작 시점의 고정값
}>>([]);

// YouTubeOverlay props
<YouTubeOverlay
  canvasX={video.canvasX}   // ❌ React 리렌더링 시에만 업데이트
  canvasY={video.canvasY}
  width={video.width}
  height={video.height}
/>
```

**문제점:**
- Transform 중에는 Konva 노드의 위치/크기가 실시간으로 변하지만
- React의 props는 리렌더링 시에만 업데이트됨
- TransformEnd 후에야 DB 업데이트 → objects 배열 업데이트 → 리렌더링

### ✅ 해결 방법 1: 실시간 Konva 노드 추적

#### 1단계: objectId 기반 추적으로 변경
```typescript
// playingVideos 배열 (수정)
const [playingVideos, setPlayingVideos] = useState<Array<{
  id: string;
  objectId: number;    // ✅ Konva 노드를 찾기 위한 ID
  videoId: string;
}>>([]);

// YouTubeOverlay props
<YouTubeOverlay
  objectId={video.objectId}  // ✅ ID만 전달
  videoId={video.videoId}
  stageRef={stageRef}
/>
```

#### 2단계: YouTubeOverlay에서 실시간 노드 조회
```typescript
// YouTubeOverlay.tsx (수정)
const updatePosition = () => {
  if (stageRef.current && overlay && !isFullscreen) {
    const stage = stageRef.current;
    const layers = stage.getLayers();

    // ✅ objectId로 실제 Konva 노드 찾기
    let targetNode: Konva.Group | null = null;
    for (const layer of layers) {
      const found = layer.find((node) => {
        return node.attrs.objectId === objectId;
      })[0] as Konva.Group | undefined;

      if (found) {
        targetNode = found;
        break;
      }
    }

    if (targetNode) {
      // ✅ Transform 중 scale도 고려
      const nodeScaleX = targetNode.scaleX();
      const nodeScaleY = targetNode.scaleY();
      const width = targetNode.width() * nodeScaleX;
      const height = targetNode.height() * nodeScaleY;

      // ✅ 실시간 위치/크기로 overlay 업데이트
      overlay.style.left = `${screenX}px`;
      overlay.style.top = `${screenY}px`;
      overlay.style.width = `${screenWidth}px`;
      overlay.style.height = `${screenHeight}px`;
    }
  }

  animationFrameId = requestAnimationFrame(updatePosition);
};
```

#### 3단계: CanvasObject에 objectId 속성 추가
```typescript
// CanvasObject.tsx
<Group
  ref={shapeRef}
  x={object.positionX}
  y={object.positionY}
  width={object.width}
  height={object.height}
  objectId={object.id}  // ✅ Konva 노드에 ID 추가
  draggable
  // ...
>
```

### 📋 문제 상황 2: 재생 중 크기를 줄이는 것만 불가능
- 크게 만들기는 작동
- 작게 만들기는 작동 안 함
- 마우스 이벤트가 차단되는 것으로 보임

### 🔍 원인 분석 2

**YouTubeOverlay의 z-index 문제:**
```typescript
// YouTubeOverlay (이전)
<div
  style={{
    position: 'fixed',
    zIndex: 1001,  // ❌ 캔버스 위에 있어서 마우스 이벤트 차단
  }}
>
```

- 오버레이가 캔버스 위를 덮어서 Transformer 핸들 클릭 불가
- 크게 만들 때는 오버레이 바깥쪽 핸들을 클릭할 수 있어서 작동
- 작게 만들려면 오버레이 안쪽 핸들을 클릭해야 하는데 차단됨

### ✅ 해결 방법 2: CSS pointer-events 활용
```typescript
// YouTubeOverlay (수정)
<div
  style={{
    position: 'fixed',
    zIndex: 1001,
    pointerEvents: 'none',  // ✅ 마우스 이벤트를 통과시킴
  }}
>
  <iframe
    style={{ pointerEvents: 'auto' }}  // ✅ iframe은 클릭 가능
  />

  <div style={{ pointerEvents: 'auto' }}>  {/* ✅ 버튼도 클릭 가능 */}
    <button>Close</button>
    <button>Fullscreen</button>
  </div>
</div>
```

### 📋 문제 상황 3: 오브젝트 드래그 시 화면(viewport)이 튐
- 오브젝트를 선택해서 드래그하면 오브젝트는 제자리
- 화면(viewport)만 다른 곳으로 이동함
- 모든 오브젝트 타입에서 공통으로 발생

### 🔍 원인 분석 3

**Stage의 handleDragEnd가 오브젝트 드래그에도 실행됨:**
```typescript
// InfiniteCanvas.tsx (이전)
const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
  setCanvasState({
    ...canvasState,
    x: e.target.x(),  // ❌ 오브젝트의 x 좌표를 Stage position으로!
    y: e.target.y(),  // ❌ 오브젝트의 y 좌표를 Stage position으로!
  });
};
```

**시나리오:**
1. 오브젝트 위치: (500, 300)
2. 사용자가 (600, 400)으로 드래그
3. 오브젝트의 handleDragEnd 호출 → DB 업데이트
4. Stage의 handleDragEnd도 호출됨
   - `e.target = Group` (오브젝트)
   - `e.target.x() = 600`
   - `setCanvasState({ x: 600, y: 400 })`
5. **Stage position이 (600, 400)로 변경 → 화면이 튐!**

### ✅ 해결 방법 3: handleDragEnd에 타겟 검증 추가
```typescript
// InfiniteCanvas.tsx (수정)
const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
  // ✅ Stage 자체를 드래그했을 때만 position 업데이트
  if (e.target === stageRef.current) {
    setCanvasState({
      ...canvasState,
      x: e.target.x(),
      y: e.target.y(),
    });
  }
};
```

### 📋 문제 상황 4: 연속 드래그 불가능 (두 번째부터 안 됨)
- 오브젝트를 한 번 드래그 → 성공
- 선택 유지한 채로 다시 드래그 → 실패
- 선택 해제 후 다시 선택하면 → 성공
- 다른 오브젝트 선택하면 → 성공

### 🔍 원인 분석 4

**Transformer가 드래그 중에 제거되고 다시 나타나면서 이벤트 가로챔:**
```typescript
// CanvasObject.tsx (이전)
const [isDragging, setIsDragging] = useState(false);

{isSelected && !isDragging && (  // ❌ 드래그 중에 Transformer 제거
  <Transformer ref={transformerRef} ... />
)}
```

**첫 번째 드래그:**
1. 오브젝트 선택 → Transformer 표시
2. 드래그 시작 → `setIsDragging(true)` → Transformer 제거
3. 드래그 진행 → Transformer 없음 → 정상 작동 ✅
4. 드래그 종료 → `setIsDragging(false)` → Transformer 다시 표시

**두 번째 드래그 (연속):**
1. Transformer가 표시된 상태
2. 드래그 시작하려고 마우스 누름
3. **Transformer가 마우스 이벤트를 먼저 가로챔** ❌
4. Group의 드래그가 시작되지 않음

### ✅ 해결 방법 4: Transformer를 항상 표시하고 ignoreStroke 설정
```typescript
// CanvasObject.tsx (수정)
{isSelected && (  // ✅ !isDragging 조건 제거 → 항상 표시
  <Transformer
    ref={transformerRef}
    ignoreStroke={true}  // ✅ 스트로크 영역에서 드래그 허용
    boundBoxFunc={(oldBox, newBox) => {
      // YouTube 오브젝트 최대 크기 제한
      if (object.objectType === ObjectType.YOUTUBE) {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        if (newBox.width > MAX_WIDTH || newBox.height > MAX_HEIGHT) {
          return oldBox;
        }
      }
      return newBox;
    }}
  />
)}
```

**ignoreStroke={true}의 효과:**
- Transformer의 외곽선 영역 클릭 시 드래그 시작 허용
- Transformer는 크기 조절 핸들만 활성화
- 오브젝트 본체를 클릭하면 드래그 가능

### 📁 수정된 파일
- `frontend/src/components/YouTubeOverlay.tsx` (line 4-82)
  - Props를 objectId로 변경
  - updatePosition에서 실시간 Konva 노드 조회
  - Transform 중 scale 고려
  - pointer-events 설정 추가

- `frontend/src/components/CanvasObject.tsx` (line 224, 236-259)
  - Group에 objectId 속성 추가
  - Transformer에 ignoreStroke 추가
  - !isDragging 조건 제거
  - YouTube 최대 크기 제한 추가

- `frontend/src/components/InfiniteCanvas.tsx` (line 36-40, 154-163, 451-471, 584-592)
  - playingVideos 타입 변경 (objectId 추가)
  - handleDragEnd에 타겟 검증 추가
  - handlePlayVideo에서 objectId 저장
  - YouTubeOverlay 렌더링 단순화

### 🧪 테스트 결과
- ✅ 재생 중 크기 조절: 썸네일과 영상이 완벽하게 동기화
- ✅ 왼쪽/위쪽 핸들 조절: 위치도 정확하게 추적
- ✅ 크게/작게 모두 가능: pointer-events로 해결
- ✅ Transform 중 실시간 추적: scale 고려로 정확한 크기 반영
- ✅ 오브젝트 드래그: 화면 안 튐, 위치 정상 업데이트
- ✅ 연속 드래그: 몇 번이든 드래그 가능
- ✅ 캔버스 패닝: 빈 영역 드래그로 여전히 가능

### 📚 교훈
1. **실시간 추적**: React props 대신 Konva 노드를 직접 조회하여 Transform 중에도 정확한 값 반영
2. **Transform의 scale**: Transform 중에는 width/height가 아닌 scaleX/scaleY가 변경됨을 이해
3. **이벤트 레이어링**: z-index가 높은 요소는 pointer-events로 제어
4. **타겟 검증의 중요성**: 이벤트 핸들러에서 항상 e.target을 확인해야 함
5. **Transformer 관리**: 드래그 중에 제거/추가하지 말고 항상 표시하되 ignoreStroke로 제어
6. **Konva 이벤트 시스템**: cancelBubble만으로는 부족할 수 있으며, 명시적 타겟 검증 필요

---

## 2025-12-14: GCP 배포 후 500 에러 (API 연결 실패 및 CORS 문제)

### 📋 문제 상황
- GCP Compute Engine에 Docker로 배포 완료
- 프론트엔드 페이지는 로드되지만 500 에러 발생
- Chrome 개발자 도구 Network 탭에서 모든 API 호출 실패 (500 Internal Server Error)
- 브라우저 콘솔에 GET 에러 발생

### 🔍 원인 분석

#### 1. 프론트엔드 환경 변수 문제
**파일**: `.env` (line 7)
```env
VITE_API_URL=http://localhost:8080  ❌
```

**문제점:**
- Vite 빌드 시점에 환경 변수가 번들에 포함됨
- 브라우저는 `localhost:8080`을 **사용자의 로컬 컴퓨터**로 인식
- GCP VM의 백엔드 서버 주소가 아님
- API 호출이 사용자의 로컬호스트로 전송되어 실패

#### 2. 백엔드 CORS 설정 문제
**파일**: `backend/src/main/resources/application.yml` (line 30)
```yaml
# CORS Configuration
web:
  cors:
    allowed-origins: "http://localhost:5173"  ❌
```

**문제점:**
- CORS는 프론트엔드가 실행되는 origin을 검증
- `http://localhost:5173`만 허용
- GCP VM의 외부 IP(예: `http://34.64.123.45:5173`)에서 접근하면 CORS 거부
- 백엔드가 모든 요청을 차단함

#### 3. 에러 발생 시나리오
```
1. 사용자: http://34.64.123.45:5173 접속
2. 프론트엔드: HTML/JS 로드 성공 ✅
3. 프론트엔드: VITE_API_URL = "http://localhost:8080"
4. API 호출: fetch("http://localhost:8080/api/objects")
5. 브라우저: 사용자의 로컬 컴퓨터:8080으로 요청 전송
6. 결과: Connection refused 또는 500 에러 ❌
```

만약 프론트엔드 URL을 올바르게 설정했어도:
```
1. API 호출: fetch("http://34.64.123.45:8080/api/objects")
2. 백엔드: Origin 확인 = "http://34.64.123.45:5173"
3. CORS 설정: allowed-origins = "http://localhost:5173"
4. 백엔드: Origin 불일치 → CORS 에러 ❌
5. 응답: 403 Forbidden 또는 500 에러
```

### ✅ 해결 방법

#### 1단계: GCP VM 외부 IP 확인
```bash
# SSH로 GCP VM 접속
gcloud compute ssh canvasearth-vm --zone=asia-northeast3-a

# 외부 IP 확인
curl ifconfig.me
```

예시 출력: `34.64.123.45`

#### 2단계: `.env` 파일 수정
```bash
cd ~/CanvasEarth
nano .env
```

수정 내용:
```env
# Database Configuration
POSTGRES_DB=canvasearth
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Frontend Configuration
VITE_API_URL=http://34.64.123.45:8080  # ✅ VM 외부 IP로 변경
```

#### 3단계: `application.yml` CORS 설정 수정
```bash
cd ~/CanvasEarth/backend/src/main/resources
nano application.yml
```

**옵션 1 - 모든 origin 허용 (개발/테스트용):**
```yaml
  # CORS Configuration
  web:
    cors:
      allowed-origins: "*"  # ✅ 모든 origin 허용
      allowed-methods: "*"
      allowed-headers: "*"
      allow-credentials: true
```

**옵션 2 - 특정 IP만 허용 (프로덕션 권장):**
```yaml
  # CORS Configuration
  web:
    cors:
      allowed-origins: "http://34.64.123.45:5173"  # ✅ VM IP로 변경
      allowed-methods: "*"
      allowed-headers: "*"
      allow-credentials: true
```

**옵션 3 - 환경 변수로 관리 (최고 권장):**
```yaml
  # CORS Configuration
  web:
    cors:
      allowed-origins: ${CORS_ALLOWED_ORIGINS:*}
      allowed-methods: "*"
      allowed-headers: "*"
      allow-credentials: true
```

그리고 `docker-compose.yml`의 backend 섹션에 환경 변수 추가:
```yaml
  backend:
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB:-canvasearth}
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER:-postgres}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      CORS_ALLOWED_ORIGINS: "http://34.64.123.45:5173"  # ✅ 추가
```

#### 4단계: 방화벽 규칙 확인 (백엔드 포트 8080)
```bash
# 방화벽 규칙 확인
gcloud compute firewall-rules list | grep 8080

# 없다면 추가
gcloud compute firewall-rules create allow-canvasearth-backend \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0 \
    --description="Allow CanvasEarth Backend API"
```

#### 5단계: Docker 컨테이너 재빌드
```bash
cd ~/CanvasEarth

# 기존 컨테이너 중지 및 삭제
docker compose down

# 재빌드 및 실행
docker compose up -d --build

# 빌드 진행 상황 확인
docker compose logs -f
```

#### 6단계: 로그 확인
```bash
# 백엔드 로그 확인
docker compose logs -f backend

# 다음 메시지 확인:
# - "Started CanvasEarthBackendApplication"
# - 에러 메시지가 없는지 확인

# 프론트엔드 로그 확인
docker compose logs -f frontend
```

#### 7단계: 컨테이너 상태 확인
```bash
docker compose ps
```

모든 컨테이너가 `Up` 상태여야 함:
```
NAME                    STATUS
canvasearth-backend     Up
canvasearth-frontend    Up
canvasearth-db          Up
```

#### 8단계: 백엔드 API 직접 테스트
```bash
# VM 내부에서 테스트
curl http://localhost:8080/api/objects

# 로컬 PC에서 테스트 (PowerShell)
Invoke-WebRequest http://34.64.123.45:8080/api/objects
```

정상 응답: `[]` 또는 오브젝트 배열

#### 9단계: 브라우저에서 테스트
```
http://34.64.123.45:5173
```

Chrome 개발자 도구 (F12) → Network 탭에서:
- `api/objects` 요청이 200 OK로 성공하는지 확인
- Response 데이터 확인

### 📁 수정된 파일
- `.env` (line 7)
  - `VITE_API_URL`: `localhost` → VM 외부 IP로 변경

- `backend/src/main/resources/application.yml` (line 30)
  - `allowed-origins`: 와일드카드(`*`) 또는 VM IP로 변경

- `docker-compose.yml` (선택사항)
  - backend 환경 변수에 `CORS_ALLOWED_ORIGINS` 추가

### 🧪 테스트 결과
- ✅ 프론트엔드 페이지 로드 성공
- ✅ API 호출 성공 (200 OK)
- ✅ 오브젝트 CRUD 작동
- ✅ CORS 에러 없음
- ✅ Network 탭에서 모든 요청 성공

### 📚 교훈
1. **Vite 환경 변수**: 빌드 시점에 번들에 포함되므로, 배포 환경에 맞게 `.env` 파일 수정 필수
2. **localhost의 의미**: 브라우저에서 `localhost`는 서버가 아닌 **사용자의 컴퓨터**를 의미
3. **CORS 설정**: 프론트엔드가 실행되는 origin(도메인+포트)과 일치해야 함
4. **환경별 설정 관리**:
   - 로컬 개발: `localhost`
   - GCP 배포: VM 외부 IP
   - 프로덕션: 도메인 이름
5. **Docker 재빌드 필요성**: 환경 변수나 소스 코드 변경 시 `--build` 플래그로 재빌드 필수
6. **방화벽 규칙**: 프론트엔드(5173)뿐만 아니라 백엔드(8080) 포트도 열어야 함

### 💡 프로덕션 권장 설정

#### 1. 도메인 사용
고정 IP 대신 도메인 이름 사용:
```env
VITE_API_URL=https://api.canvasearth.com
```

#### 2. HTTPS 적용
- GCP Load Balancer + SSL 인증서
- 또는 Nginx 리버스 프록시 + Let's Encrypt

#### 3. 환경별 `.env` 파일
```
.env.development    # 로컬 개발
.env.staging        # 스테이징
.env.production     # 프로덕션
```

#### 4. 보안 강화
- CORS: 특정 도메인만 허용
- PostgreSQL 비밀번호 강화
- 백엔드 포트(8080) 외부 노출 제거 (내부 네트워크만)
- Nginx 리버스 프록시로 프론트엔드만 외부 노출

---
