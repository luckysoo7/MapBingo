# Sprint 4 계약서 — IndexedDB 캐싱 + 첫 화면 UX

## 목표

재방문 시 파싱 없이 즉시 지도 복원 + 캐시 on/off 토글

---

## 구현 범위

### 1. IndexedDB 캐시 모듈 (`app/lib/cache.ts`)
- `saveCache(photos, stats)` / `loadCache()` / `clearCache()`
- DB name: `snaproute`, store: `cache`, keys: `photos`, `districtStats`
- 순수 IndexedDB — 외부 라이브러리 없음

### 2. 캐시 복원 (`app/hooks/useCacheRestore.ts`)
- 앱 마운트 시 1회 실행 (status === 'idle'일 때만)
- localStorage `snaproute-cache` !== 'off'이면 IndexedDB에서 복원
- 복원 성공 → setParseResult + setDistrictStats → status='done' → 오버레이 숨김

### 3. 파싱 후 자동 저장 (`usePhotoUpload.ts` 수정)
- aggregateStats 완료 후 `saveCache()` 호출
- 캐시 비활성이면 저장 스킵

### 4. TopBar 설정 토글 (캐시 on/off)
- 기어 아이콘 클릭 → 드롭다운/토글 표시
- off 전환 시 `clearCache()` 호출 + localStorage 플래그 설정
- `data-testid="cache-toggle"` 부착

### 5. 첫 화면 UX
- 이미 구현됨: status='idle' → UploadOverlay 표시 (회색 지도 + 드래그앤드롭 안내)
- 캐시 없으면 자동으로 이 상태 유지 → 추가 작업 없음

---

## 성공 기준

- [ ] mock 데이터 저장 → 페이지 리로드 → 오버레이 없이 지도 복원됨
- [ ] 캐시 토글 off → clearCache → 리로드 → 오버레이 표시됨
- [ ] 캔버스 높이 > 600px (회귀 방지)

---

## 파일 변경 목록

| 파일 | 변경 |
|---|---|
| `app/lib/cache.ts` | 신규 생성 |
| `app/hooks/useCacheRestore.ts` | 신규 생성 |
| `app/hooks/usePhotoUpload.ts` | 수정 — 파싱 후 saveCache 호출 |
| `app/components/TopBar.tsx` | 수정 — 캐시 토글 추가 |
| `app/page.tsx` | 수정 — useCacheRestore 호출 |
| `tests/sprint4.spec.ts` | 신규 생성 |
