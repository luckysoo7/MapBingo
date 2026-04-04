# sprint_contract_1.md — EXIF 파싱 엔진

## 목표
사진 폴더 선택 → GPS 좌표 + 날짜 배열 추출 + Mapbox 지도 기본 표시

## 구현 범위
- Next.js 14 + TypeScript 프로젝트 셋업
- MapLibre GL JS + MapTiler 지도 기본 표시 (한국 중심, 밝은 지도)
- 파일 업로드 UI (PC 드래그앤드롭 + showDirectoryPicker)
- exifr + Web Worker EXIF 파싱 (UI 블로킹 없이)
- 진행률 표시 ("N / M장 분석 중...")
- HEIC / GPS 없는 파일 스킵 + 안내 메시지

## 성공 기준
- [ ] 폴더 선택 → PhotoData[] 배열이 콘솔에 출력됨
- [ ] 1,000장 처리 시 UI 블로킹 없음 (Web Worker 동작 확인)
- [ ] HEIC 파일은 스킵되고 "N장 미지원 형식" 메시지 표시
- [ ] GPS 없는 사진 스킵 + "N장 위치 없음" 메시지 표시
- [ ] 지도가 한국 중심으로 표시됨
