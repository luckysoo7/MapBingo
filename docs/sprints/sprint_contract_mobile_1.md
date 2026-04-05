# Sprint Mobile-1 계약서 — Expo 셋업 + MapLibre 실기기 검증

## 목표

`mobile/` 디렉토리에 Expo 프로젝트 생성 → 실기기에서 MapLibre 한국 지도가 렌더링되는 것 확인.
**이 Sprint가 Go/No-Go 게이트다.** MapLibre 실기기 검증 실패 시 Sprint 2 이후 확정 보류.

---

## 구현 범위

### 1. 프로젝트 초기화

```bash
cd /home/lucky/projects/SnapRoute
npx create-expo-app mobile --template blank-typescript
```

`mobile/app.json` 설정:
```json
{
  "expo": {
    "name": "MapBingo",
    "slug": "mapbingo",
    "newArchEnabled": false,
    "android": {
      "package": "com.lucky.mapbingo"
    }
  }
}
```

### 2. 의존성 설치

```bash
cd mobile
npx expo install expo-media-library
npx expo install @maplibre/maplibre-react-native
npx expo install expo-location
```

`package.json` devDependencies:
- `@types/maplibre__maplibre-react-native` (있으면)

### 3. MapTiler API 키 설정

`mobile/.env.local`:
```
EXPO_PUBLIC_MAPTILER_KEY=<기존 웹과 동일 키>
```

### 4. 지도 화면 구현 (`mobile/app/index.tsx`)

- MapLibre `MapView` 전체 화면으로 렌더링
- MapTiler Streets-v2 스타일 URL (웹과 동일)
- 한국 중심 초기 좌표: `{ latitude: 36.5, longitude: 127.5, zoom: 6 }`
- `districts.geojson` 로드 → FillLayer로 행정구역 경계선만 표시 (색상은 Sprint 3)
- 권한 요청 없음 (Sprint 4에서 추가)

### 5. `districts.geojson` 복사

```bash
cp public/districts.geojson mobile/assets/districts.geojson
```

Metro bundler가 JSON 파일을 require()로 로드하도록 `metro.config.js` 설정.

### 6. 실기기 테스트용 개발 빌드

```bash
cd mobile
npx expo run:android   # USB 연결 실기기에 직접 설치
```

(Expo Go는 maplibre-react-native native module을 지원하지 않음 → 반드시 개발 빌드 필요)

---

## 성공 기준

- [ ] `mobile/` Expo 프로젝트가 에러 없이 빌드됨
- [ ] 실기기(Android)에서 앱 실행 시 MapLibre 지도가 전체 화면으로 렌더링됨
- [ ] 한국 지도 중심으로 초기 로드됨 (위도 36.5, 경도 127.5)
- [ ] districts.geojson 경계선이 지도에 표시됨 (FillLayer 또는 LineLayer)
- [ ] 지도 드래그/줌 인터랙션이 정상 동작함
- [ ] 앱 크래시 없음 (특히 지도 회전 시)

---

## 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| maplibre v11 크래시 | `newArchEnabled: false` + maplibre v10 stable로 다운그레이드 |
| Expo Go에서 동작 안 함 | 예상된 동작 — 반드시 `expo run:android` 사용 |
| GPU 렌더링 에뮬레이터 이슈 | 실기기 필수. 에뮬레이터 결과로 Pass 판정 금지 |
| districts.geojson Metro 로드 실패 | `metro.config.js`에 `resolver.assetExts` 추가 |

---

## 파일 목록

```
mobile/
├── app.json
├── app/
│   └── index.tsx          ← 지도 화면
├── assets/
│   └── districts.geojson  ← 웹에서 복사
├── metro.config.js
├── package.json
└── .env.local
```

---

## 다음 Sprint 조건

이 Sprint 통과 시 → Sprint Mobile-2 (expo-media-library GPS 수집 파이프라인) 진행
실기기에서 지도 렌더링 실패 시 → maplibre 대안 조사 (react-native-maps + custom overlay)
