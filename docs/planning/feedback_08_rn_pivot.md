# MDplanner — React Native + Expo 피벗 계획

> 웹 버전의 구조적 한계(33K장 모바일 처리 ~24분)를 극복하기 위해
> React Native + Expo로 피벗. 아래 결정을 확인해줘.

---

## Q1. 앱 이름

현재 웹은 "MapBingo". RN 앱도 같은 이름으로 갈지, 새 이름을 쓸지.

추천: **MapBingo 유지** — 브랜드 연속성. 웹은 "MapBingo (Web Demo)", 앱은 "MapBingo"로.

> 답변:

---

## Q2. 타겟 플랫폼

추천: **Android 우선, iOS는 Phase 2** — expo-media-library의 iOS 권한 모델이 Android와 달라서 별도 검증 필요. Android 실사용 검증이 먼저.

> 답변:

---

## Q3. 레포 구조

- A. **현재 SnapRoute repo에 `/mobile` 서브디렉토리** 추가 (모노레포)
- B. **새 repo** (`mapbingo-mobile` 등) — 웹과 완전 분리

추천: **A (모노레포)** — `districts.geojson`, 타입 정의, 행정구역 매핑 로직을 공유하기 편함.

> 답변:

---

## Q4. 배포 목표

- A. **개인 사용** — `adb install` 또는 Expo Go로 충분
- B. **Play Store 출시** — EAS Build + 스토어 등록 필요

추천: **A로 시작, B는 Phase 2** — Play Store 출시는 스크린샷, 개인정보처리방침, 심사 등 부가작업이 많음. 먼저 동작하는 앱을 만들고 결정.

> 답변:

---

## Q5. Feasibility Gate — 실제 최대 규모

현재 가정: **33,000장**. 앞으로 이 규모가 더 커질 수 있나?

(이 숫자가 10x가 되면 MediaStore 쿼리 자체는 여전히 빠르지만, JS 행정구역 매칭이 다시 병목이 될 수 있음. 미리 알아야 아키텍처 결정 가능.)

> 답변: 아니야 그 이상 가는건 고려하지 않아

---

## 내가 이미 결정한 것들 (확인만)


| 결정          | 내용                                              |
| --------------- | --------------------------------------------------- |
| 기반 스택     | Expo SDK 52+, TypeScript, Zustand                 |
| 사진 접근     | `expo-media-library` (MediaStore 네이티브 브릿지) |
| 지도          | `@maplibre/maplibre-react-native`                 |
| 행정구역 매칭 | turf.js + bbox 1차 필터 추가 (웹 대비 10x 최적화) |
| 재활용        | `districts.geojson`, 타입 정의, 집계 로직         |
| 웹 버전       | 현재 상태 유지 (PC 데모용, 더 이상 개발 안 함)    |
| MVP 기능      | 웹 MVP와 동일 (지도 시각화 + 통계 카드)           |

이 항목 중 바꾸고 싶은 것 있으면 답변에 적어줘.

> 답변: 잘했어
