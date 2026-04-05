# MapBingo Mobile — spec (RN + Expo)

> 웹 버전 구조적 한계(33K장 모바일 ~24분) 극복을 위한 React Native 피벗.
> 작성: 2026-04-05

---

## 목표

GPS EXIF 사진 → 방문한 한국 행정구역 → 색깔 지도 시각화.
웹과 동일한 기능, 모바일에서 **30초 이내** 처리.

---

## 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Expo SDK 52+ (Bare Workflow) | EAS Build, expo-media-library |
| 언어 | TypeScript | 웹 코드 재활용 |
| 상태 관리 | Zustand | 웹과 동일 |
| 사진 접근 | expo-media-library | MediaStore 네이티브 브릿지 |
| 지도 | @maplibre/maplibre-react-native | GeoJSON 레이어 지원 |
| 행정구역 매칭 | turf.js + bbox 1차 필터 | 웹 로직 재활용 |
| 빌드/배포 | EAS Build (개인용 APK) | Play Store는 Phase 2 |

**New Architecture 비활성화:** `app.json` → `"newArchEnabled": false`
(maplibre-react-native의 Fabric 호환성 이슈 회피. 검증 후 활성화 검토)

---

## 웹과의 차이점

| | 웹 | 모바일 |
|--|--|--|
| 사진 접근 | showDirectoryPicker + exifr | expo-media-library (MediaStore) |
| GPS 취득 | 파일 열어서 EXIF 파싱 | DB 쿼리 (파일 안 열음) |
| 처리 시간 | ~24분 (33K장) | 목표 30초 이내 |
| 플랫폼 | 브라우저 (PC 최적) | Android 우선 |

---

## 재활용 파일

- `public/districts.geojson` — 251 시/군/구 GeoJSON
- `app/types/index.ts` — Photo, DistrictStat 타입 (경로만 조정)
- 행정구역 집계 로직 (geoMapping)
- 색상 스케일 (`#E8E8E8 → #1B5E20`)

---

## 아키텍처

```
[expo-media-library]
  getAssetsAsync({ mediaType: 'photo', first: 50 })
  → { id, location: { latitude, longitude } }
  배치 반복 (endCursor 기반 페이지네이션)
  → 33K장 × 배치 = 전체 GPS 수집 (목표: 5~15초)
         ↓
[turf.js 행정구역 매칭]
  bbox 1차 필터 → booleanPointInPolygon
  → districtStats (방문 횟수, 날짜)
  목표: 10~20초
         ↓
[MapLibre GeoJSON 레이어]
  districts.geojson + 색상 fill-color expression
  목표: 즉시 렌더링
```

---

## MVP 기능 (Phase 1)

웹 MVP와 동일한 기능 세트:

- [ ] 권한 요청 화면 (READ_MEDIA_IMAGES + ACCESS_MEDIA_LOCATION)
- [ ] 사진 분석 진행 화면 (배치 진행률 표시)
- [ ] 행정구역 색상 지도
- [ ] 통계 카드 (방문 구역 수 / 전체 비율)
- [ ] 로컬 캐시 (Zustand persist + AsyncStorage)

---

## 제약 조건 & Breaking Point

| 제약 | 값 |
|------|-----|
| 최대 지원 규모 | 33,000장 (이 이상은 설계 범위 밖) |
| GPS 없는 사진 | 스킵 (집계 제외) |
| HEIC | expo-media-library가 URI만 반환하므로 GPS는 정상 취득 가능 |
| Android 버전 | 10+ (ACCESS_MEDIA_LOCATION 권한 필요) |
| maplibre 리스크 | New Architecture OFF로 회피. Sprint 1에서 실기기 검증 필수 |

**Breaking point:** 행정구역 매칭(JS)이 33K × 251 polygon에서 30초 초과 시 → Worklet(Reanimated) 또는 native module 필요. Sprint 1에서 실측.

---

## 레포 구조

현재 SnapRoute repo 내 `/mobile` 서브디렉토리:

```
SnapRoute/
├── app/              ← 웹 (현재 상태 유지, PC 데모용)
├── mobile/           ← 새 RN 앱
│   ├── app/          ← Expo Router
│   ├── src/
│   │   ├── types/    ← 웹 types 복사 또는 symlink
│   │   ├── lib/      ← geoMapping, colorScale
│   │   └── store/    ← Zustand
│   ├── assets/
│   │   └── districts.geojson  ← 웹과 공유 (복사)
│   └── app.json
└── public/           ← 웹 static assets
```

---

## 스프린트 계획

| Sprint | 목표 | 성공 기준 |
|--------|------|-----------|
| 1 | Expo 셋업 + MapLibre 실기기 검증 | 실기기에서 MapLibre 지도 렌더링 확인 |
| 2 | expo-media-library GPS 수집 + 배치 파이프라인 | 33K장 GPS 수집 15초 이내 |
| 3 | 행정구역 매칭 + 지도 시각화 | 색상 지도 렌더링 30초 이내 |
| 4 | 통계 카드 + 캐시 | 재시작 시 1초 이내 복원 |
| 5 | 권한 UX + 엣지케이스 + APK 빌드 | EAS로 APK 생성, 실기기 설치 |

**Sprint 1이 가장 중요:** maplibre-react-native 실기기 동작 확인 전까지 나머지 스프린트는 확정 보류.
