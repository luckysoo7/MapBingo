# AGENTS.md

MapBingo — GPS EXIF 사진으로 방문한 한국 행정구역을 지도에 시각화하는 웹 서비스.
완전 클라이언트사이드. 사진은 브라우저 밖으로 전송되지 않음.

---

## Active scope

**웹앱 (`app/`)** — 현재 활성 개발 대상. 리뷰 범위.
**모바일 (`mobile/`)** — 개발 보류 중. 리뷰 범위 제외. 수정 금지.

---

## Repository layout

```
app/
  components/   React 컴포넌트 (MapView, UploadOverlay, ProgressBar, StatsCard, TopBar 등)
  hooks/        커스텀 훅 (usePhotoUpload, useCacheRestore)
  lib/          유틸리티 (geoMapping, colorScale, cache)
  store/        Zustand 전역 상태 (useAppStore)
  workers/      Web Worker (exif.worker.ts — EXIF 파싱)
  types/        TypeScript 타입 정의
tests/          Playwright e2e 테스트 (24개 통과 유지 필수)
docs/sprints/   sprint_contract 파일
docs/planning/  MDplanner Q&A 파일
public/         정적 자원 (districts.geojson 포함)
mobile/         React Native + Expo — 보류, 수정/리뷰 제외
```

---

## Commands

```bash
# Dev server
npm run dev

# e2e 테스트 (24/24 통과 필수)
npx playwright test

# 타입 체크
npx tsc --noEmit

# 전체 검증
bash scripts/verify.sh
```

---

## Rules

- `mobile/` 디렉토리 수정 금지 (개발 보류)
- Playwright 테스트 24개 전부 통과 상태 유지 필수 (1 skip은 정상)
- TypeScript strict 모드. 타입 어노테이션은 변경한 코드에만 추가
- 새 Zustand 상태 필드는 반드시 `reset()`에도 포함
- MapLibre fill-color/line-color expression에서 `visitDays` 접근 시 반드시 `coalesce` 사용
  (`['coalesce', ['get', 'visitDays'], 0]` — null이면 런타임 에러)
- 불필요한 추상화/헬퍼 함수 금지 (YAGNI, DRY, KISS)
- debug용 `pushDebug()` 호출은 개발 후 정리

## Forbidden zones

- `mobile/` — 보류 중, 수정 금지
- `.env.local` — 환경변수, 커밋 금지
- `public/districts.geojson` — 행정구역 GeoJSON 원본, 임의 수정 금지

---

## Done definition

See `docs/done_definition.md`

## Review guidelines

See `docs/code_review.md`
