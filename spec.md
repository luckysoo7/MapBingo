# SnapRoute — 제품 스펙 (Planner 산출물)

> **이 문서는 MVP 착수 전 초기 기획안입니다. 구현 중 변경된 결정이 있으며, 현재 상태는 CLAUDE.md를 참고하세요.**
> feedback_01~04 기획 과정의 최종 결론. 각 스프린트에서 실제 합의된 내용은 `docs/sprints/sprint_contract_N.md` 참고.

---

## 서비스 개요

사진의 GPS EXIF 메타데이터를 읽어서, 방문한 행정구역을 지도에 시각적으로 표현하는 웹 서비스.
**이름:** SnapRoute  
**대상:** 여행을 다니며 사진을 찍는 사람. GPS가 포함된 사진 보유자.  
**핵심 가치:** 내가 살면서 어디를 얼마나 돌아다녔는지, 지도에서 한눈에 확인.

---

## 사용자 경험 (핵심 플로우)

```
1. 웹앱 접속 → 회색 한국 지도 + 드래그앤드롭 안내
2. 사진 폴더 선택 (PC 드래그앤드롭 / 안드로이드 Chrome 폴더 선택)
3. "1,247장 중 832장 분석 중..." 진행률 표시
4. 완료 → 방문한 시/군/구가 초록색으로 채워진 지도
5. 행정구역 클릭 → 통계 카드 (방문 일수 / 사진 장수 / 첫 방문일)
6. 다음 방문 시 즉시 지도 복원 (IndexedDB 캐싱)
```

---

## 확정 기술 스택

```
프레임워크:  Next.js 14 (App Router) + TypeScript
지도:        MapLibre GL JS + MapTiler 타일 (완전 무료, 카드 불필요)
GeoJSON:     southkorea/southkorea-maps (통계청 공공데이터, 무료)
EXIF 파싱:  exifr (클라이언트사이드)
공간 연산:  @turf/boolean-point-in-polygon + @turf/bbox
성능:        Web Worker (EXIF 파싱 + point-in-polygon)
상태관리:   Zustand
캐싱:        IndexedDB (GPS 데이터 + 집계 결과만, 사진 원본 없음)
스타일링:   Tailwind CSS
배포:        Vercel (무료 플랜)
```

---

## 데이터 모델

```typescript
// 사진 1장당 파싱 결과
type PhotoData = {
  id: string           // 파일명 기반 고유 ID
  lat: number
  lng: number
  date: string         // "2024-03-15" (KST 기준)
  districtCode: string // "11140" (시/군/구 코드)
  districtName: string // "마포구"
  sidoName: string     // "서울특별시"
}

// 지도에 표시할 집계 결과
type DistrictStats = {
  code: string
  name: string
  visitDays: number    // 중복 제거한 날짜 수 (로그 스케일 색상 기준)
  photoCount: number
  firstVisit: string
  lastVisit: string
}
```

---

## 시각화 규칙

**색상 팔레트 (초록 계열, 로그 스케일):**
```
미방문:   #E8E8E8 (연한 회색)
1-2일:    #C8E6C9
3-7일:    #81C784
8-20일:   #388E3C
21일+:    #1B5E20
```

**줌 레벨:**
- zoom 5-6: 시/도 경계
- zoom 7-9: 시/군/구 색칠 + 방문 일수 숫자
- zoom 10+: 읍/면/동 전환 (추후 구현)

**지도 배경:** MapTiler Streets (미니멀, 흰 배경)

---

## MVP 기능 목록 (완료 기준)

- [ ] 사진 폴더 선택 (PC 드래그앤드롭 + `showDirectoryPicker`, 안드로이드 Chrome)
- [ ] EXIF GPS + 날짜 추출 (exifr, Web Worker, JPEG/PNG 지원)
- [ ] GPS → 시/군/구 매핑 (GeoJSON + turf.js point-in-polygon)
- [ ] 시/군/구 색칠 (로그 스케일, 초록 팔레트)
- [ ] 방문 일수 숫자 표시 (줌 레벨 따라 on/off)
- [ ] 행정구역 클릭 → 통계 카드 (방문 일수 / 사진 장수 / 첫 방문일)
- [ ] HEIC 파일 스킵 + "N장 미지원 형식" 안내
- [ ] GPS 없는 사진 스킵 + 안내
- [ ] 처리 진행률 표시 ("N / M장 분석 중...")
- [ ] IndexedDB 캐싱 (저장 기본, 설정에서 끄기 가능)
- [ ] 첫 화면: 회색 한국 지도 + 드래그앤드롭 안내
- [ ] 모바일 반응형 (PC 상단바 / 모바일 하단 탭바)

---

## 스프린트 계획

### Sprint 1 — 프로젝트 셋업 + EXIF 파싱 엔진

**목표:** 사진 폴더 선택 → GPS 좌표 + 날짜 배열 추출까지

구현 범위:
- Next.js + TypeScript 프로젝트 생성, Mapbox 지도 기본 표시
- 파일 업로드 UI (드래그앤드롭 + `showDirectoryPicker`)
- exifr + Web Worker EXIF 파싱
- 진행률 표시 컴포넌트
- HEIC / GPS 없는 파일 스킵 처리

성공 기준:
- [ ] 폴더 선택 → `PhotoData[]` 배열이 콘솔에 출력됨
- [ ] 1,000장 처리 시 UI 블로킹 없음 (Web Worker 동작 확인)
- [ ] HEIC 파일은 스킵되고 안내 메시지 표시

---

### Sprint 2 — GeoJSON 매핑 + 지도 색칠

**목표:** GPS 좌표 → 행정구역 매핑 → 지도 색칠

구현 범위:
- southkorea-maps GeoJSON 로드 전략 (시/군/구 전체 + 줌인 시 읍면동 온디맨드)
- turf.js point-in-polygon (bounding box 최적화 포함)
- Mapbox GeoJSON 레이어 + fill-color 표현식 (로그 스케일)
- Zustand 스토어 설계 (PhotoData[], DistrictStats[])

성공 기준:
- [ ] 실제 사진 업로드 시 방문한 시/군/구가 초록색으로 색칠됨
- [ ] 색상이 방문 일수에 따라 로그 스케일로 진해짐
- [ ] 500장 → 매핑 완료 시간 3초 이내

---

### Sprint 3 — 숫자 레이블 + 통계 카드

**목표:** 지도 위 숫자 표시 + 클릭 인터랙션

구현 범위:
- 방문 일수 숫자 레이블 레이어 (줌 레벨 minzoom 설정)
- 행정구역 클릭 → 통계 카드 팝업 (방문 일수, 사진 장수, 첫/마지막 방문일)
- 작은 폴리곤 숫자 클리핑 처리

성공 기준:
- [ ] zoom 7+ 에서 방문 지역에 숫자 표시
- [ ] 행정구역 클릭 시 통계 카드 정상 표시
- [ ] 미방문 지역 클릭 시 반응 없음

---

### Sprint 4 — IndexedDB 캐싱 + 첫 화면 UX

**목표:** 재방문 시 즉시 지도 복원 + 온보딩 경험

구현 범위:
- IndexedDB 저장/불러오기 (GPS 데이터 + 집계 결과)
- 앱 시작 시 캐시 확인 → 있으면 즉시 지도 표시
- 첫 화면: 회색 한국 지도 + 드래그앤드롭 안내 레이어
- 설정: 저장 on/off 토글

성공 기준:
- [ ] 새로고침 후 지도가 파싱 없이 즉시 복원됨
- [ ] 첫 방문 시 회색 지도 + 안내 UI 표시
- [ ] "저장 끄기" 시 IndexedDB에 아무것도 남지 않음

---

### Sprint 5 — 모바일 반응형 + 엣지 케이스 마무리

**목표:** 안드로이드 Chrome에서 정상 동작 + 완성도

구현 범위:
- 모바일 레이아웃 (하단 탭바, 터치 제스처 최적화)
- 안드로이드 Chrome `showDirectoryPicker` 동작 확인
- 삼성 인터넷 브라우저 미지원 안내
- 엣지 케이스 처리 (빈 폴더, 중복 업로드, 매우 작은 폴리곤)

성공 기준:
- [ ] 안드로이드 Chrome에서 폴더 선택 → 지도 표시 정상 동작
- [ ] 모바일에서 행정구역 탭 시 통계 카드 표시
- [ ] 삼성 인터넷에서 Chrome 권장 안내 표시

---

## 제외 사항 (backlog.md 참고)

읍/면/동 단계, 스냅샷 공유, 사진 썸네일 핀, 위성 지도, 통계 탭, 기간 필터
