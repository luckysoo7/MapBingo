# Sprint 5 계약서 — 모바일 반응형 + 엣지 케이스

## 목표

모바일(안드로이드 Chrome)에서 정상 동작 + 침묵 에러 해소 + 미지원 브라우저 안내

---

## 구현 범위

### 1. UploadOverlay 반응형 (`app/components/UploadOverlay.tsx`)
- 카드 너비: `w-[460px]` → `max-w-[460px] w-[calc(100%-32px)]`
- 패딩: `p-12` → `sm:p-12 p-8`
- 모바일에서 "사진 폴더를 드래그해서 놓으세요" 텍스트 숨김 (`hidden sm:block`)
- 모바일에서 "폴더 선택하기" 버튼 더 크게 (`sm:px-8 px-12 sm:py-2.5 py-3.5`)
- "또는" 구분선도 모바일에서 숨김 (`hidden sm:flex`)

### 2. StatsCard 모바일 하단 시트 (`app/components/StatsCard.tsx`)
- PC: 현재 디자인 유지 (`absolute bottom-6 left-4 w-64`)
- 모바일: 하단 전체 너비 시트 (`sm:w-64 sm:left-4 w-full left-0 bottom-0 rounded-t-xl sm:rounded-xl`)
- z-index: `z-20` 유지

### 3. SavePrompt 모바일 대응 (`app/components/SavePrompt.tsx`)
- PC: 현재 수평 레이아웃 유지
- 모바일: `whitespace-nowrap` 제거, 세로 스택 레이아웃 (`sm:flex-row flex-col`)
- 너비: `sm:w-auto w-[calc(100%-32px)]`
- z-index: `z-30` (StatsCard z-20보다 위)

### 4. 미지원 브라우저 감지 (`app/components/UploadOverlay.tsx`)
- `typeof window.showDirectoryPicker === 'function'` 체크
- 미지원 시 "폴더 선택하기" 버튼 대신 안내 메시지 표시
- 문구: "이 브라우저는 폴더 선택을 지원하지 않습니다. Chrome을 사용해 주세요."
- `data-testid="unsupported-browser"` 부착

### 5. 빈 폴더 안내 (`app/hooks/usePhotoUpload.ts`)
- `files.length === 0`일 때 store에 에러 상태 세트
- 새 store state: `emptyFolderWarning: boolean`
- UploadOverlay에서 경고 표시: "폴더에 사진이 없습니다"
- 3초 후 자동 해제 또는 다음 업로드 시 리셋

### 6. GPS 없는 사진만 있을 때 안내
- 파싱 완료 후 `photos.length === 0 && (skippedNoGps > 0 || skippedHeic > 0)`일 때
- status='done'이지만 지도가 빈 상태 → 안내 메시지 오버레이 표시
- 문구: "GPS 정보가 있는 사진을 찾지 못했습니다. (N장 위치 정보 없음)"
- `data-testid="no-gps-warning"` 부착

---

## 성공 기준 (Evaluator 검증 항목)

- [ ] 모바일 뷰포트(390×844)에서 UploadOverlay가 화면 안에 완전히 보임
  → 카드 너비가 뷰포트 너비보다 작음 확인
- [ ] 모바일에서 "드래그해서 놓으세요" 텍스트가 보이지 않음
- [ ] 모바일에서 StatsCard가 하단 전체 너비로 표시됨
  → `getBoundingClientRect().width`가 뷰포트 너비와 동일
- [ ] `showDirectoryPicker` 미지원 환경에서 안내 메시지 표시됨
  → `[data-testid="unsupported-browser"]` visible
- [ ] 빈 폴더 선택 시 "폴더에 사진이 없습니다" 표시됨
- [ ] GPS 없는 사진만 업로드 시 안내 메시지 표시됨
  → `[data-testid="no-gps-warning"]` visible
- [ ] 캔버스 높이 > 600px (회귀 방지)

---

## 파일 변경 목록

| 파일 | 변경 유형 |
|---|---|
| `app/components/UploadOverlay.tsx` | 수정 — 반응형 + 미지원 브라우저 안내 |
| `app/components/StatsCard.tsx` | 수정 — 모바일 하단 시트 |
| `app/components/SavePrompt.tsx` | 수정 — 모바일 레이아웃 + z-index |
| `app/hooks/usePhotoUpload.ts` | 수정 — 빈 폴더 처리 |
| `app/store/useAppStore.ts` | 수정 — emptyFolderWarning state 추가 |
| `app/page.tsx` | 수정 — GPS 없는 사진 안내 컴포넌트 추가 (필요 시) |
| `tests/sprint5.spec.ts` | 신규 생성 |

---

## 리스크

- **showDirectoryPicker 감지 타이밍**: SSR에서 `window`가 없으므로 클라이언트 마운트 후 체크 필요 (useEffect + useState 패턴)
- **StatsCard 하단 시트 전환**: PC↔모바일 브레이크포인트에서 깜빡임 가능 → Tailwind `sm:` 프리픽스로 CSS-only 전환, JS 불필요
- **빈 폴더 경고 타이밍**: `showDirectoryPicker`가 취소될 때와 빈 폴더를 구분해야 함 → catch 블록은 취소, `files.length === 0`은 빈 폴더
