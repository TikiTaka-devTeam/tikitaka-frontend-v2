# Tikitaka Frontend Guide

## 1. Service

**Tikitaka**
강의자료 중심 실시간 노트 및 질문 아카이빙 시스템

Tikitaka는 강의자료, 실시간 필기, 개인 필기, 질문 및 답변을 하나의 웹 환경에서 연결하는 학습 플랫폼이다.

핵심 개념은 다음과 같다.

> 강의자료를 중심으로 강의 중 생성되는 필기, 질문, 답변을 연결하고 강의 종료 이후에도 학습 아카이브로 활용한다.

---

# 2. Frontend Stack

Current frontend stack:

```text
React
Vite
JavaScript
CSS
Axios
WebSocket
PDF Renderer
Canvas
```

Deployment:

```text
GitHub
   ↓
Cloudflare Pages
   ↓
HTTPS Frontend
```

Backend:

```text
Java
Spring Boot
REST API
WebSocket
```

프론트엔드는 Cloudflare Pages에서 HTTPS로 제공된다.

---

# 3. Main Domain Structure

서비스의 주요 구조는 다음과 같다.

```text
User
 └─ Space
     ├─ Lecture Documents
     │   └─ Slides
     │       ├─ Shared Notes
     │       ├─ Private Notes
     │       └─ Questions
     │
     ├─ Question Archive
     ├─ Notices
     ├─ Assignments
     └─ Members
```

서비스의 중심 객체는 **Space와 Lecture Document**다.

---

# 4. Main Dashboard

사용자가 참여하거나 운영하는 강의를 확인하는 시작 화면이다.

주요 기능:

* 참여 강의 목록
* 최근 공지사항
* 최근 질문
* 새로운 강의 생성
* 참여 코드 입력
* Space 이동
* 사용자 계정
* 알림

---

# 5. Space

Space는 하나의 강의를 나타낸다.

예:

```text
운영체제
데이터베이스
알고리즘
컴퓨터네트워크
```

Space 내부에는 다음 정보가 존재한다.

```text
Space
├── Lecture Information
├── Documents
├── Questions
├── Notices
├── Assignments
└── Members
```

Space 화면에서는 다음과 같은 강의 기본 정보를 표시할 수 있다.

* 강의명
* 담당 교수
* 강의 시간
* 학기
* 강의 코드
* 참여 인원

---

# 6. Lecture Document

강의자료는 PDF를 중심으로 구성된다.

사용자는 강의자료를 열람하면서 필기 및 질문 기능을 사용할 수 있다.

주요 기능:

* PDF 열람
* 페이지 이동
* 확대 / 축소
* 필기
* 교수 필기 표시
* 학생 개인 필기
* 질문 작성

---

# 7. Slide

PDF의 각 페이지는 서비스에서 Slide 단위로 관리될 수 있다.

중요:

```text
PDF page index
≠
display order
≠
slide identifier
```

페이지 삽입, 삭제, 교체 등의 기능이 존재할 수 있으므로 화면에 표시되는 순서와 서버 식별자를 동일한 값이라고 가정하지 않는다.

Slide에는 다음 데이터가 연결될 수 있다.

```text
Slide
├── Shared Layer
├── Private Layer
├── Questions
└── Position Metadata
```

---

# 8. Drawing Layers

강의자료 필기는 크게 두 레이어로 구분한다.

## Shared Layer

교수자가 작성하는 필기.

```text
Professor
    ↓
Shared Drawing
    ↓
WebSocket
    ↓
Students
```

모든 수강생에게 표시된다.

## Private Layer

학생 개인 필기.

```text
Student
    ↓
Private Drawing
    ↓
Only current student
```

다른 학생에게 공유되지 않는다.

두 레이어를 UI와 데이터 처리 과정에서 명확히 구분한다.

---

# 9. Canvas

Canvas는 강의자료 위의 필기 입력을 담당한다.

고려 대상:

* pointer position
* canvas coordinate
* PDF coordinate
* zoom
* viewport
* devicePixelRatio
* touch
* stylus
* mouse

화면 좌표와 실제 저장 좌표를 동일하게 취급하지 않는다.

Zoom 또는 viewport가 변경되어도 기존 필기의 위치가 유지되어야 한다.

---

# 10. Questions

학생은 강의자료의 특정 슬라이드 또는 특정 위치를 기준으로 질문을 생성할 수 있다.

개념적으로:

```text
Question
├── Space
├── Document
├── Slide
├── Position
├── Author
├── Content
└── Answer
```

질문은 단순 게시판 글이 아니라 **강의자료의 맥락과 연결된 데이터**다.

따라서 질문 UI 구현 시 document / slide context를 유지해야 한다.

---

# 11. Question Archive

강의 중 생성된 질문을 한곳에서 조회하는 기능이다.

주요 기능:

* 전체 질문 보기
* 특정 질문 보기
* 질문 작성
* 내 질문 보기
* 특정 강의자료 질문 보기
* 질문 필터링
* 최신순
* 인기순
* 유사 질문 그룹

AI를 통해 의미가 유사한 질문을 그룹화하거나 요약할 수 있다.

---

# 12. Question Interaction

질문은 다음과 같은 흐름을 가진다.

```text
Lecture Document
       ↓
Select Slide / Position
       ↓
Create Question
       ↓
Question Stored
       ↓
Professor / AI Answer
       ↓
Question Archive
```

강의자료 화면과 질문 아카이브는 독립된 서비스가 아니라 동일한 질문 데이터를 서로 다른 맥락에서 보여주는 UI다.

---

# 13. Notices

공지사항 기능은 다음을 포함할 수 있다.

* 목록
* 상세 조회
* 작성
* 수정
* 삭제
* 첨부파일
* 중요 공지
* 검색
* 정렬

교수자와 학생의 권한 차이를 고려한다.

---

# 14. Assignments

과제 기능:

Professor:

* 과제 생성
* 수정
* 삭제
* 제출 기한 설정
* 첨부파일
* 제출 현황 확인
* 피드백
* 성적

Student:

* 과제 목록
* 상세 조회
* 제출
* 재제출
* 제출 상태 확인

---

# 15. Members

Space의 멤버 관리 기능이다.

주요 기능:

* 참여 코드
* 멤버 목록
* 참여 요청
* 승인
* 거절
* 참여 인원

교수자 중심 관리 기능과 학생의 일반 조회 기능을 구분한다.

---

# 16. User Roles

대표적인 역할:

```text
Professor
Student
```

## Professor

```text
Create Space
Upload Document
Shared Drawing
Answer Question
Manage Notice
Manage Assignment
Manage Member
```

## Student

```text
Join Space
View Document
View Shared Drawing
Private Drawing
Create Question
View Question Archive
Submit Assignment
```

---

# 17. API

Frontend는 Spring Boot REST API와 통신한다.

API 관련 코드는 가능한 한 중앙화된 client/module 구조를 사용한다.

예시 구조:

```text
src/
└── api/
    ├── client.js
    ├── authApi.js
    ├── dashboardApi.js
    ├── searchApi.js
    ├── spaceApi.js
    ├── documentApi.js
    ├── noticeApi.js
    ├── questionApi.js
    ├── assignmentApi.js
    ├── memberApi.js
    ├── notificationApi.js
    └── noteApi.js
```

실제 Repository 구조가 이와 다르다면 **현재 Repository 구조를 우선한다.**

문서 구조에 맞추기 위해 기존 코드를 재배치하지 않는다.

---

# 18. Real-Time Communication

실시간 기능은 WebSocket을 사용한다.

대표적인 데이터:

```text
Professor Drawing
        ↓
Spring Boot
        ↓
WebSocket
        ↓
Connected Students
```

WebSocket connection은 가능한 한 필요한 범위에서 공유하고 컴포넌트마다 중복 연결하지 않는다.

---

# 19. UI / UX Direction

Tikitaka UI의 주요 목표는 다음과 같다.

* 강의자료 중심
* 태블릿 친화적
* 스타일러스 친화적
* 직관적인 화면 이동
* 일관된 디자인
* 높은 정보 가독성
* 실시간 상호작용 지원

Desktop browser에서도 정상적으로 사용할 수 있어야 한다.

---

# 20. Design Preservation

이미 구현된 Tikitaka UI는 프로젝트의 디자인 기준으로 취급한다.

새로운 화면을 구현할 때 우선 확인한다.

```text
existing page
existing component
existing CSS
existing layout
Figma design
```

그 후 동일한 디자인 언어를 사용한다.

새로운 디자인 시스템을 임의로 만들지 않는다.

---

# 21. Frontend Priorities

구현 우선순위는 다음 기준을 따른다.

```text
Correctness
    ↓
Existing UI preservation
    ↓
User interaction
    ↓
Maintainability
    ↓
Optimization
```

성능 최적화를 이유로 동작 중인 구조를 필요 이상으로 변경하지 않는다.

---

# 22. Development Principle

Tikitaka Frontend는 일반적인 CRUD 웹사이트가 아니다.

핵심 관계는 다음과 같다.

```text
Lecture
   ↓
Document
   ↓
Slide
   ↓
┌───────────────────────────┐
│ Shared Drawing            │
│ Private Drawing           │
│ Question                  │
│ Answer                    │
└───────────────────────────┘
   ↓
Learning Archive
```

따라서 새로운 기능을 구현하거나 기존 코드를 수정할 때 항상 다음 질문을 먼저 확인한다.

> 이 기능은 현재 Space, Document, Slide, User 중 어떤 context에 속하는가?

이 관계를 유지하는 것을 프론트엔드 구현의 기본 원칙으로 한다.
