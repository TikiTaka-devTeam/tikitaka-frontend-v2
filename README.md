# tikitaka-frontend-v2

기존 `tikitaka-frontend`와 동일한 기술 스택 및 기능 단위 디렉터리 구조로 만든 프런트엔드 골격입니다. 실제 화면과 비즈니스 로직은 포함하지 않습니다.

## 기술 스택

- React 19, React Router 7
- Vite 8, ESLint 10
- Axios, Firebase, Zustand
- STOMP.js, SockJS
- Vite PWA, SVGR
- pnpm 10, Node.js 22 (CI 기준)

## 시작하기

```bash
pnpm install
cp .env.example .env
pnpm dev
```

검증 명령:

```bash
pnpm lint
pnpm build
```

## 환경 변수

`.env.example`을 참고하세요. `.env`와 `.env.*`는 커밋하지 않으며 `.env.example`만 추적합니다.

## 디렉터리

- `src/app`: 앱 진입 라우팅
- `src/components/common`: 공통 UI
- `src/features`: 도메인별 API, 컴포넌트, 페이지, 상태 및 스타일
- `src/lib/api`: 공통 API 클라이언트
- `src/firebase`: Firebase 설정과 메시징 모듈 위치
- `src/assets`: 폰트, 아이콘, 이미지
- `src/styles`: 전역 스타일

## 배포 설정

GitHub Actions 템플릿은 수동 실행만 허용합니다. `.github/workflows/frontend-deploy.yml`의 TODO와 필요한 GitHub Secrets를 설정한 후 배포 정책에 맞게 push 트리거를 활성화하세요.
