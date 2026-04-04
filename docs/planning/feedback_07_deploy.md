# Vercel 배포 — MDplanner Q&A

> SnapRoute MVP를 Vercel에 배포합니다.
> 각 질문에 추천안이 있습니다. 동의하면 답변란을 비워두세요 (= 추천 수락).

---

## Q1. GitHub에 push

현재 로컬에만 커밋이 있고 GitHub에는 올라가지 않은 상태입니다.
Vercel은 GitHub 저장소와 연결해서 자동 배포합니다.

- **A안**: 기존 GitHub 저장소(SnapRoute)에 push — 이미 `Initial commit from Create Next App`이 있는 저장소
- **B안**: 새 저장소 생성 후 push

추천: A안 — 이미 origin이 설정되어 있으므로 `git push origin main`만 하면 됨.

> 답변:

---

## Q2. MapTiler API 키 관리

현재 `.env.local`에 `NEXT_PUBLIC_MAPTILER_KEY`가 있습니다.
Vercel에서는 이걸 Environment Variables로 설정해야 합니다.

- **A안**: Vercel 대시보드에서 수동으로 환경변수 설정
- **B안**: Vercel CLI로 설정

추천: A안 — 대시보드 GUI가 직관적이고, 키를 한 번만 넣으면 됨. CLI보다 실수 가능성 적음.

> 답변:

---

## Q3. 도메인

Vercel은 기본적으로 `프로젝트명.vercel.app` URL을 줍니다.

- **A안**: 기본 URL 사용 (예: snaproute.vercel.app)
- **B안**: 커스텀 도메인 연결 (별도 도메인 구매 필요)

추천: A안 — MVP 단계에서 커스텀 도메인은 불필요. 나중에 언제든 추가 가능.

> 답변:

---

## Q4. 빌드 확인

Vercel에 올리기 전에 로컬에서 `npm run build`가 성공하는지 확인해야 합니다.
타입 에러나 빌드 경고가 있으면 배포가 실패합니다.

- **A안**: 내가 먼저 로컬 빌드 테스트 후 push
- **B안**: 그냥 push하고 Vercel에서 실패하면 고침

추천: A안 — 로컬에서 먼저 잡는 게 빠름. Vercel 빌드 로그는 읽기 불편함.

> 답변:

---

## Q5. Vercel 계정 연결 방식

Vercel에 가입하고 GitHub 저장소를 연결해야 합니다.

- **A안**: 브라우저에서 vercel.com 접속 → GitHub로 가입 → Import Repository
- **B안**: Vercel CLI (`npx vercel`)로 터미널에서 진행

추천: A안 — 첫 배포는 브라우저 대시보드가 시각적으로 따라가기 쉬움. CLI는 로그인 과정이 WSL2에서 번거로울 수 있음.

> 답변:
