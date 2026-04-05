# Code Review Guidelines

## Priorities

1. **Correctness** — 실제로 동작하는가
2. **Regression risk** — 기존 24개 Playwright 테스트 통과 여부
3. **Security** — 클라이언트사이드 서비스이므로 XSS, 민감정보 노출 주의
4. **Maintainability** — 읽기 쉬운가, 불필요한 복잡도는 없는가
5. **Nitpick** — 마지막에, 최소화

---

## Review style

- 구체적이고 실행 가능한 피드백만
- 파일명 + 라인 번호 반드시 명시
- 스타일 지적 최소화
- 이미 동작하는 코드에 대규모 리라이트 요청 금지
- 이미 해결된 이슈 재지적 금지
- `mobile/` 코드는 리뷰 제외

---

## Must-check items

**브라우저 API 관련**
- `showDirectoryPicker` 사용 시 feature detection 여부
- Web Worker postMessage에 Transferable 미사용으로 인한 복사 비용
- IndexedDB/AsyncStorage 크기 한도 초과 위험

**MapLibre 관련**
- `['get', 'visitDays']`는 반드시 `['coalesce', ['get', 'visitDays'], 0]`로 감싸야 함
- `source.setData()` 타이밍 — 레이어 준비 전 호출 시 silent 실패

**Zustand 관련**
- 새 상태 필드가 `reset()`에 포함됐는가
- `persist` partialize에서 대용량 배열 저장 여부 (locations 33K는 금지)

**일반**
- 비동기 에러 핸들링 누락
- `useCallback` deps 배열 누락/불완전
- null/undefined 처리 누락
- 새 기능에 대한 Playwright 테스트 누락 (회귀 가능성 있는 경우)
