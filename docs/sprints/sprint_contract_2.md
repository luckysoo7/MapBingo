# sprint_contract_2.md — GeoJSON 매핑 + 지도 색칠

## 목표
EXIF로 뽑은 GPS 좌표 → 시/군/구 매핑 → 지도에 초록 색칠

## 구현 범위
- southkorea-maps GeoJSON (시/군/구) public/ 에 저장 후 fetch
- Web Worker 안에서 turf.js point-in-polygon으로 GPS → 행정구역 매핑
- Zustand 스토어에 DistrictStats[] 집계 (방문 일수 중복 제거, 로그 스케일)
- MapLibre fill 레이어 + fill-color 표현식 (초록 팔레트)
- 미방문 지역 #E8E8E8, 방문 지역 일수에 따라 4단계 초록

## 성공 기준
- [ ] 실제 GPS 사진 업로드 시 방문한 시/군/구가 초록으로 색칠됨
- [ ] 색상이 방문 일수에 따라 로그 스케일로 진해짐 (4단계)
- [ ] 미방문 지역은 연한 회색 (#E8E8E8)
- [ ] 500장 기준 매핑 완료 시간 3초 이내 (bounding box 최적화)
- [ ] GeoJSON 로드 실패 시 에러 표시 없이 지도만 표시

## 색상 팔레트 (확정)
- 미방문: #E8E8E8
- 1-2일:  #C8E6C9
- 3-7일:  #81C784
- 8-20일: #388E3C
- 21일+:  #1B5E20
