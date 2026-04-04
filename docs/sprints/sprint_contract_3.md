# Sprint 3 계약서 — 숫자 레이블 + 통계 카드

## 목표

지도 위 방문 일수 숫자 표시 + 행정구역 클릭 시 통계 카드 팝업

---

## 구현 범위

### 1. 숫자 레이블 레이어 (`districts-label`)
- MapLibre `symbol` 레이어, `minzoom: 7`
- `visitDays > 0`인 구역에만 숫자 표시 (filter 사용)
- `text-field: ['to-string', ['get', 'visitDays']]`
- 흰 텍스트 + 검정 halo (가독성)
- MapView.tsx의 `m.on('load', ...)` 안에서 기존 fill/outline 레이어와 함께 추가

### 2. 클릭 이벤트 핸들러
- `map.on('click', 'districts-fill', handler)` — MapView.tsx에 추가
- 클릭된 feature의 `properties.code`로 `useAppStore.getState().districtStats`에서 매칭
- 매칭 결과가 있고 `visitDays > 0`이면 `selectDistrict(stats)` 호출
- 매칭 없거나 `visitDays === 0`이면 아무 반응 없음
- 커서 스타일: `districts-fill` 위에서 `pointer`로 변경

### 3. StatsCard 컴포넌트 (`app/components/StatsCard.tsx`)
- Zustand `selectedDistrict` 구독
- `selectedDistrict === null`이면 렌더링 없음
- 표시 내용: 구/시/군명, 시/도명, 방문 일수, 사진 장수, 첫 방문일, 마지막 방문일
- 닫기 버튼 → `selectDistrict(null)`
- 위치: 지도 위 좌측 하단 (PC 기준), `absolute` 포지션
- `data-testid="stats-card"` 부착

### 4. page.tsx에 StatsCard 추가
- MapView 옆에 `<StatsCard />` 마운트

### 5. 개발 환경 스토어 노출 (테스트 인프라)
- `app/store/useAppStore.ts`에서 dev 환경에서만 `window.__snaprouteStore` 노출
- Playwright 테스트가 `page.evaluate()`로 mock data 주입 가능하게

---

## 성공 기준 (Evaluator 검증 항목)

- [ ] zoom 7 이상에서 방문 지역에 visitDays 숫자가 텍스트로 표시됨  
  → `symbol` 레이어가 DOM에 존재하고 `minzoom: 7` 속성 확인
- [ ] mock DistrictStats 주입 후 stats-card가 DOM에 나타남  
  → `page.evaluate()`로 `selectDistrict(mockData)` 호출 → `[data-testid="stats-card"]` visible
- [ ] 카드에 구역명·방문 일수·사진 장수·첫 방문일이 표시됨  
  → 각 값이 카드 텍스트에 포함됨 확인
- [ ] 닫기 버튼 클릭 → 카드 사라짐  
  → `[data-testid="stats-card-close"]` 클릭 → 카드 DOM에서 제거
- [ ] 미방문 selectDistrict(null) → 카드 없음  
  → `selectDistrict(null)` 호출 후 카드 not visible

---

## 파일 변경 목록

| 파일 | 변경 유형 |
|---|---|
| `app/components/MapView.tsx` | 수정 — 레이블 레이어 + 클릭 핸들러 추가 |
| `app/components/StatsCard.tsx` | 신규 생성 |
| `app/page.tsx` | 수정 — `<StatsCard />` 추가 |
| `app/store/useAppStore.ts` | 수정 — dev 환경 window 노출 |
| `tests/sprint3.spec.ts` | 신규 생성 |

---

## 리스크

- **폰트**: MapTiler Streets-v2 스타일에 포함된 폰트만 `text-font`으로 사용 가능. 잘못된 폰트명 → 레이블 미표시. 스타일 JSON에서 실제 사용 가능한 폰트 확인 후 적용.
- **레이블 겹침**: 작은 폴리곤에서 숫자가 겹칠 수 있음. MapLibre 기본 collision detection으로 자동 처리됨 (허용 범위).
- **클릭 정밀도**: 경계선 클릭 시 여러 feature 반환 가능 → `features[0]`만 처리.
