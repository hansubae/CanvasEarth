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
