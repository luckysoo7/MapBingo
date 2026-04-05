# Sprint Mobile-2 계약서 — GPS 수집 파이프라인

## 목표

expo-media-library로 기기 전체 사진의 GPS 좌표를 배치 수집.
**성공 기준: 33K장 기준 GPS 수집 완료까지 15초 이내 (MediaStore 쿼리만)**

⚠️ Sprint 1 실기기 검증 통과 후 최종 확정. 코드는 미리 작성.

---

## 구현 범위

### 1. 타입 정의 (`mobile/src/types/index.ts`)

웹의 `Photo` 타입에서 파일 접근 관련 필드 제거, 모바일 전용으로 단순화.

```ts
export interface PhotoLocation {
  id: string
  latitude: number
  longitude: number
  creationTime: number  // MediaStore creationTime (ms)
}
```

### 2. GPS 수집 훅 (`mobile/src/hooks/useMediaScan.ts`)

- `expo-media-library` `getAssetsAsync` 배치 페이지네이션 (first: 200)
- `location` 필드 없는 사진 스킵
- 진행률: `{ scanned, total, locations }` 스트리밍
- 완료 후 `PhotoLocation[]` 반환

### 3. Zustand 스토어 (`mobile/src/store/useAppStore.ts`)

```ts
type Status = 'idle' | 'requesting' | 'scanning' | 'matching' | 'done' | 'error'

interface AppState {
  status: Status
  progress: { scanned: number; total: number }
  locations: PhotoLocation[]
  error: string | null
  // actions
  startScan: () => void
  reset: () => void
}
```

### 4. 권한 요청 → 스캔 시작 흐름 (`mobile/App.tsx`)

- `idle`: "사진 분석 시작" 버튼 표시
- `requesting`: 권한 요청 → 거부 시 안내 메시지
- `scanning`: 진행 바 (`scanned / total`)
- `done`: GPS 수집 완료 개수 표시 (지도는 Sprint 3)

---

## 성공 기준

- [ ] 권한 요청 → 허용 → 스캔 시작 흐름 동작
- [ ] 배치 페이지네이션으로 전체 사진 순회 (OOM 없음)
- [ ] GPS 없는 사진 자동 스킵
- [ ] 진행률 UI 업데이트 (스캔 중 숫자 변화)
- [ ] 스캔 완료 후 `PhotoLocation[]` 개수 화면에 표시
- [ ] 실기기 33K장 기준 15초 이내 (Sprint 1 통과 후 측정)

---

## 파일 목록

```
mobile/
└── src/
    ├── types/
    │   └── index.ts
    ├── hooks/
    │   └── useMediaScan.ts
    └── store/
        └── useAppStore.ts
```
