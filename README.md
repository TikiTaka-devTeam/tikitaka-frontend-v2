# Tikitaka Frontend

Tikitaka는 강의자료를 중심으로 필기, 질문, 공지사항, 과제를 연결하는 강의 플랫폼입니다. 이 저장소는 React 기반 프론트엔드입니다.

## 주요 기능

- Space 생성·참여 및 강의자료 관리
- PDF 강의자료 열람과 페이지별 필기·질문
- 교수자·학생별 강의 화면
- 강의자료 수정: PDF 페이지 삽입·삭제, 실행 취소·다시 실행, 저장 요청
- 공지사항, 과제, 멤버 관리
- 로그인·회원가입 및 대시보드
- (질문 및 필기는 구현 중에 있습니다)
> 기능별 API 연동 범위와 요청·응답 형식은 `API_SPEC.md`를 확인하세요. 강의자료 수정 저장 요청은 비동기 `PROCESSING` 상태로 접수되며, PDF 생성 완료 여부 조회는 아직 연동되지 않았습니다.

## 기술 스택

- React 19, React Router 7, JavaScript
- Vite 8, CSS
- Axios, Zustand
- PDF.js(`pdfjs-dist`), Canvas
- STOMP.js, SockJS
- pnpm 10, Node.js 22(CI 기준)

## 로컬 실행

```bash
pnpm install
cp .env.example .env
pnpm dev
```

`.env`의 `VITE_API_BASE_URL`을 실행할 백엔드 주소로 설정하세요.

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api/v1
```
`.env`와 `.env.*` 파일은 Git 추적 대상에서 제외되며, `.env.example`만 공유합니다.
백엔드 주소 필요하시면 요청해주세요. - 양준호 -

## 검증

```bash
pnpm lint
pnpm build
pnpm preview
```

`pnpm preview`는 빌드 결과를 로컬에서 확인할 때 사용합니다.

## 프로젝트 구조

```text
src/
├── app/                 # 앱 라우팅
├── assets/              # 이미지, 아이콘, 폰트
├── components/common/   # 공통 UI
├── features/            # 기능별 페이지, 컴포넌트, API, 스타일
├── lib/api/             # 공통 Axios 클라이언트
└── styles/              # 전역 스타일
```

주요 기능은 `auth`, `dashboard`, `spaces`, `documents`, `lecture`, `notices`, `assignments`, `members`, `search`로 나뉩니다.

## 개발 문서

- `FRONTEND_GUIDE.md`: 서비스 도메인과 프론트엔드 구조
- `API_SPEC.md`: 백엔드 API 명세
- `DB_SPEC.md`: 데이터베이스 명세
- `RESPONSIVE.md`: 반응형 UI 기준
- `AGENTS.md`: 이 저장소의 작업 원칙

## 빌드 및 배포 설정

`main` 브랜치에 push되면 GitHub Actions가 의존성 설치, 프로덕션 환경 변수 확인, 빌드를 실행하고 결과를 Discord 웹훅으로 알립니다. 현재 `.github/workflows/frontend-deploy.yml`에는 **실제 호스팅 서비스에 빌드 결과물을 업로드하는 단계가 없습니다.** 워크플로의 성공 알림은 배포 완료가 아닌 빌드 성공을 의미합니다.

GitHub Actions 실행에는 `VITE_API_BASE_URL`과 `DISCORD_WEBHOOK_URL` Secrets가 필요합니다. 
`wrangler.jsonc`에는 정적 파일 제공을 위한 설정이 있습니다.
