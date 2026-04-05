# Sprint Mobile-3 계약서 — 행정구역 매칭 + 지도 색상

## 목표

`PhotoLocation[]` → 행정구역별 방문 횟수 집계 → MapLibre FillLayer 색상 시각화.
**성공 기준: 33K GPS × 251 구역 매칭 + 렌더링 완료 30초 이내 (Sprint 2 시간 포함)**

⚠️ Sprint 1 MapLibre 실기기 검증 통과 후 최종 확정.

---

## 구현 범위

### 1. 행정구역 매칭 로직 (`mobile/src/lib/geoMapping.ts`)

웹 버전 `geoMapping.ts` 로직 이식 + bbox 1차 필터 추가.

```ts
// bbox 1차 필터: 구역 바운딩박스 미리 계산 → 해당 bbox 밖 구역은 skip
// → 251 polygon 전부 pointInPolygon 하는 대신 평균 ~5개만 검사
```

- `PhotoLocation[]` + `FeatureCollection` → `Map<districtName, number>` (방문 횟수)
- 웹 Worker 없이 메인 JS 스레드에서 실행 (RN에서 Worklet 불필요한지 실측 후 판단)

### 2. 색상 스케일 (`mobile/src/lib/colorScale.ts`)

웹과 동일: `#E8E8E8 → #C8E6C9 → #81C784 → #388E3C → #1B5E20` (log scale)

### 3. Zustand 스토어 확장 (`mobile/src/store/useAppStore.ts`)

```ts
districtStats: Map<string, number>  // districtName → 방문 횟수
setDistrictStats: (stats: Map<string, number>) => void
```

### 4. MapLibre FillLayer 색상 표현식 (`mobile/App.tsx`)

```ts
// GeoJSON Feature에 방문 횟수 프로퍼티 주입
const coloredGeoJson = injectVisitCounts(districtsGeoJson, districtStats)

// FillLayer fill-color expression
fillColor: ['case',
  ['>', ['get', 'visitCount'], 0], ['interpolate', ['linear'], ['get', 'visitCount'], ...],
  '#E8E8E8'
]
```

### 5. 통계 카드 (`mobile/src/components/StatsCard.tsx`)

- 방문 구역 수 / 전체 251 구역
- 방문 비율 (%)
- 하단 고정 반투명 카드

---

## 성공 기준

- [ ] GPS 수집 완료 후 자동으로 매칭 시작 (`status: 'matching'`)
- [ ] 방문한 구역이 초록 계열로 색상화됨 (방문 횟수 많을수록 진함)
- [ ] 미방문 구역은 `#E8E8E8` (연회색)
- [ ] 통계 카드에 방문 구역 수 표시
- [ ] 매칭 시간 측정값 로그 출력 (성능 확인용)

---

## 파일 목록

```
mobile/src/
├── lib/
│   ├── geoMapping.ts
│   └── colorScale.ts
└── components/
    └── StatsCard.tsx
```
