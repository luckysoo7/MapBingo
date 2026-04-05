# Done Definition

작업이 완료된 것으로 간주하는 기준.

## 필수 조건

- [ ] `npx tsc --noEmit` — 앱 코드 오류 없음 (`tests/` 폴더의 기존 TS2352 오류는 예외)
- [ ] `npx playwright test` — 24/24 통과 (1 skip 정상)
- [ ] debug용 `console.log` / `pushDebug` 정리됨
- [ ] TODO 주석 없음

## 새 기능일 경우 추가 조건

- [ ] 새 Zustand 상태 필드가 `reset()`에 포함됨
- [ ] 회귀 가능성 있는 변경이면 Playwright 테스트 케이스 추가
- [ ] CLAUDE.md 내 sprint 상태 업데이트 (해당 시)
