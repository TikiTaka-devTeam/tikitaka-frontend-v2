# Tikitaka Frontend — Codex Agent Instructions

## 1. Project Overview

Tikitaka는 **강의자료 중심 실시간 노트 및 질문 아카이빙 플랫폼**이다.

프론트엔드는 단순한 일반 웹 서비스가 아니라 다음 경험을 중심으로 설계한다.

* 강의자료(PDF) 열람
* 교수자 실시간 필기 표시
* 학생 개인 필기
* 슬라이드 위치 기반 질문
* 질문 및 답변 아카이브
* 강의 Space 관리
* 공지사항 / 과제 / 멤버 관리

Frontend stack:

* React
* Vite
* JavaScript
* CSS
* Axios
* WebSocket
* PDF rendering
* Canvas-based drawing

---

# 2. Primary Rule

기존 코드와 디자인을 최대한 보존하면서 **최소 범위로 수정한다.**

Codex는 작업을 시작하기 전에 반드시 관련 코드를 먼저 읽고 현재 구현 방식을 파악한다.

다음 행동을 금지한다.

* 요청하지 않은 파일 수정
* 요청하지 않은 컴포넌트 리팩터링
* 기존 디자인 시스템 임의 변경
* 기존 폴더 구조 임의 변경
* 기존 API 구조 임의 변경
* 필요하지 않은 dependency 추가
* 요청 범위를 넘어선 기능 구현
* 정상 동작하는 코드를 개인 취향에 따라 재작성

특히 하나의 화면을 수정할 때 다른 페이지의 레이아웃이나 공통 컴포넌트에 영향을 줄 가능성이 있다면 먼저 영향 범위를 확인한다.

---

# 3. Before Editing

코드를 수정하기 전에 다음 순서로 확인한다.

1. 요청과 직접 관련된 파일 탐색
2. 관련 컴포넌트 구조 확인
3. 관련 CSS 확인
4. 공통 컴포넌트 사용 여부 확인
5. API 연결 여부 확인
6. 다른 페이지에서 동일 컴포넌트를 사용하는지 확인
7. 변경 영향 범위 판단
8. 최소 변경 방법 선택

기존 구현을 확인하지 않고 새로운 구조를 먼저 만들지 않는다.

---

# 4. Scope Control

사용자가 특정 영역을 지정했다면 해당 영역만 수정한다.

예:

> 질문 카드의 여백을 수정해줘.

이 경우 다음을 임의로 변경하지 않는다.

* 전체 페이지 레이아웃
* Typography
* 다른 카드 디자인
* Header
* Toolbar
* Routing
* API
* 다른 페이지 CSS

문제를 해결하기 위해 공통 파일 수정이 필요한 경우 해당 변경이 다른 화면에 미치는 영향을 먼저 확인한다.

영향 범위가 크거나 요청 범위를 넘어갈 가능성이 있다면 수정 전에 사용자에게 알린다.

---

# 5. Existing UI Preservation

Tikitaka는 이미 정의된 UI 구조와 디자인을 우선한다.

기존 화면을 수정할 때 다음을 유지한다.

* 기존 레이아웃 구조
* 기존 색상 체계
* 기존 Border / Radius
* 기존 Typography
* 기존 Toolbar
* 기존 Sidebar / Panel 구조
* 기존 Component hierarchy

새로운 화면도 기존 Tikitaka 화면의 디자인 언어를 기준으로 작성한다.

기존 Figma 또는 구현된 화면과 충돌하는 새로운 디자인 패턴을 임의로 도입하지 않는다.

---

# 6. Component Rules

새로운 UI를 구현하기 전에 기존 컴포넌트를 재사용할 수 있는지 확인한다.

재사용 우선순위:

1. 기존 공통 컴포넌트
2. 기존 페이지 내부 컴포넌트
3. 기존 컴포넌트 확장
4. 새로운 컴포넌트 생성

단, 단순히 재사용 가능하다는 이유만으로 기존 컴포넌트를 과도하게 추상화하지 않는다.

중복이 명확하고 실제 재사용 가치가 있을 때만 공통 컴포넌트로 분리한다.

---

# 7. CSS Rules

CSS 수정 시 다음 원칙을 따른다.

* 기존 CSS 구조 유지
* 기존 class naming convention 유지
* 필요 이상의 global selector 사용 금지
* `!important` 사용 최소화
* 기존 값을 이유 없이 변경하지 않음
* 동일한 스타일이 존재하면 재사용
* 특정 페이지 수정이 다른 페이지에 영향을 주지 않도록 scope 확인

레이아웃 문제를 해결할 때 임의의 숫자를 반복해서 넣는 방식보다 원인이 되는 요소를 먼저 찾는다.

예:

* margin
* padding
* gap
* line-height
* flex alignment
* grid
* width / height
* box-sizing
* positioning

---

# 8. Responsive UI

Tikitaka는 **태블릿 환경을 주요 사용 환경으로 고려한다.**

따라서 화면 구현 시 다음을 고려한다.

* 태블릿 화면
* Desktop browser
* Touch interaction
* Stylus interaction
* 화면 축소 시 레이아웃 붕괴 여부

단, 사용자가 요청하지 않은 전체 반응형 구조를 임의로 다시 작성하지 않는다.

---

# 9. API Integration

API 호출은 기존 API client 구조를 우선 사용한다.

새로운 API를 연결하기 전에 다음을 확인한다.

* 기존 Axios instance
* baseURL
* Authorization 처리
* Access Token 처리
* API module 구조
* error handling 방식

컴포넌트 내부에서 새로운 Axios instance를 임의로 만들지 않는다.

API endpoint를 추측해서 구현하지 않는다.

API 명세가 없거나 불명확하면 TODO 또는 mock 처리 여부를 사용자에게 확인한다.

---

# 10. Authentication

인증 관련 로직은 기존 프로젝트 정책을 유지한다.

현재 구조를 확인하지 않고 다음을 변경하지 않는다.

* access token 저장 방식
* refresh token 처리
* Authorization header
* 로그인 redirect
* logout 처리
* 인증 상태 관리

인증 문제를 UI 문제와 섞어서 리팩터링하지 않는다.

---

# 11. Real-Time Features

Tikitaka의 실시간 기능은 중요한 핵심 기능이다.

주요 대상:

* 교수자 공유 필기
* 실시간 Canvas 데이터
* 질문 업데이트
* WebSocket 기반 이벤트

WebSocket 관련 코드를 수정할 경우 반드시 다음을 확인한다.

* connection 생성 위치
* subscription
* cleanup
* reconnect
* duplicate connection 가능성
* component unmount 처리

불필요한 WebSocket connection을 추가하지 않는다.

---

# 12. PDF / Canvas

강의자료 화면은 Tikitaka의 핵심 화면이다.

PDF 또는 Canvas 관련 작업 시 기존 렌더링 구조를 우선 유지한다.

특히 다음 데이터의 관계를 깨뜨리지 않는다.

* document
* slide
* page number
* canvas
* shared drawing layer
* private drawing layer
* question position

화면상의 페이지 순서와 서버에서 관리하는 slide/page 식별자를 임의로 동일한 개념으로 가정하지 않는다.

---

# 13. Role-Based UI

Tikitaka에는 교수자와 학생의 기능 차이가 존재한다.

교수자 예:

* 강의 생성
* 자료 관리
* 공유 필기
* 질문 답변
* 공지사항 작성
* 과제 관리
* 멤버 관리

학생 예:

* 강의 참여
* 자료 열람
* 개인 필기
* 질문 작성
* 질문 아카이브 확인
* 과제 제출

Role-dependent UI를 구현할 때 단순히 UI를 숨기는 것과 실제 권한 처리를 혼동하지 않는다.

백엔드 권한 검증이 필요한 기능은 프론트엔드 UI 제한만으로 보안을 해결했다고 가정하지 않는다.

---

# 14. Error Handling

API 또는 비동기 작업에는 필요한 수준의 상태를 고려한다.

* loading
* success
* empty
* error

단순 UI 작업에 불필요하게 복잡한 상태 관리 시스템을 도입하지 않는다.

오류를 숨기기 위해 빈 `catch`를 작성하지 않는다.

---

# 15. Dependencies

새로운 npm package 추가는 최소화한다.

추가하기 전에 다음을 확인한다.

1. 현재 dependency로 구현 가능한가?
2. Browser API로 해결 가능한가?
3. 프로젝트에 이미 비슷한 library가 존재하는가?
4. 새로운 package가 실제로 필요한가?

dependency 추가가 필요한 경우 이유를 명확히 설명한다.

---

# 16. Verification

수정 후 가능한 범위에서 다음을 확인한다.

```bash
npm run build
```

프로젝트에 lint script가 존재하면 함께 확인한다.

```bash
npm run lint
```

수정한 코드 때문에 기존 build가 실패하지 않는지 확인한다.

기존 오류와 새롭게 발생한 오류를 구분한다.

---

# 17. Final Response

작업 완료 후 장황하게 설명하지 않는다.

다음 내용을 중심으로 보고한다.

* 무엇을 변경했는지
* 어떤 파일을 변경했는지
* 중요한 구현 판단
* build / lint 결과
* 남아 있는 문제

예:

```text
수정 완료.

변경 파일:
- src/pages/QuestionArchive.jsx
- src/styles/questionArchive.css

변경 내용:
- 질문 카드 상단 여백 수정
- 기존 레이아웃 및 Toolbar 유지
- 다른 질문 페이지에는 영향 없음

검증:
- npm run build 성공
```

---

# 18. Core Principle

Tikitaka Frontend 작업의 기본 원칙은 다음과 같다.

> Read first. Understand existing patterns. Change the minimum necessary. Preserve the existing Tikitaka design and architecture.

큰 리팩터링보다 **정확한 최소 변경**을 우선한다.
