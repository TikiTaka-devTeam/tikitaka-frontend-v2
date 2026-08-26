# Tikitaka Frontend API Specification

> 프론트엔드 개발을 위한 API 연동 명세입니다.
>
> Base URL: `/api/v1`

---

## 공통 사항

### 인증

로그인이 필요한 API는 Access Token을 사용합니다.

```http
Authorization: Bearer {access_token}
```

### 사용자 역할

| Role | 설명 |
| --- | --- |
| `STUDENT` | 학생 |
| `PROFESSOR` | 교수 |
| `ASSISTANT` | 조교 |

### Space 참여 상태

| Status | 설명 |
| --- | --- |
| `PENDING` | 승인 대기 |
| `APPROVED` | 승인 완료 |
| `DENIED` | 승인 거절 |

### Space 상태

| Status | 설명 |
| --- | --- |
| `ACTIVE` | 활성화 |
| `ARCHIVED` | 보관 |

### Cursor Pagination

무한 스크롤 목록 API는 Cursor Pagination을 사용합니다.

```http
?cursor={next_cursor}&size=20
```

응답:

```json
{
  "next_cursor": "cursor-value",
  "has_next": true
}
```

- 최초 요청에서는 `cursor` 생략
- 다음 요청에서는 이전 응답의 `next_cursor` 사용
- `has_next === false`이면 추가 요청하지 않음
- 클라이언트에서 cursor 값을 직접 생성하거나 수정하지 않음

---

# 1. 사용자 / 인증 API

## API 목록

| ID | Method | Endpoint | 설명 | 인증 |
| --- | --- | --- | --- | --- |
| USR-001 | POST | `/auth/oauth/{provider}` | OAuth 로그인 | X |
| USR-002 | POST | `/auth/oauth/signup` | OAuth 신규 회원가입 | X |
| USR-003 | POST | `/auth/phone/verification` | 휴대폰 인증번호 발송 | X |
| USR-004 | POST | `/auth/phone/verification/confirm` | 인증번호 확인 | X |
| USR-005 | GET | `/auth/email/check` | 이메일 중복 확인 | X |
| USR-006 | GET | `/auth/phone/check` | 휴대폰 번호 중복 확인 | X |
| USR-007 | POST | `/auth/signup` | 일반 회원가입 | X |
| USR-008 | POST | `/auth/login` | 이메일 로그인 | X |
| USR-009 | POST | `/auth/token/refresh` | Access Token 재발급 | X |
| USR-010 | POST | `/auth/logout` | 로그아웃 | O |
| USR-011 | PATCH | `/users/me/password` | 비밀번호 변경 | O |
| USR-012 | GET | `/users/me` | 내 정보 조회 | O |
| USR-013 | PATCH | `/users/me/profile-image` | 프로필 이미지 변경 | O |
| USR-014 | POST | `/inquiries` | 서비스 문의 | O |

---

## USR-008 로그인

```http
POST /api/v1/auth/login
```

### Request

```json
{
  "email": "student@example.com",
  "password": "Test1234!"
}
```

### Response

```json
{
  "access_token": "token",
  "refresh_token": "token",
  "user": {
    "user_id": "uuid",
    "name": "김선민",
    "account_type": "STUDENT"
  }
}
```

---

## USR-012 내 정보 조회

```http
GET /api/v1/users/me
```

### Response

```json
{
  "user_id": "uuid",
  "email": "student@example.com",
  "name": "김선민",
  "phone_number": "010-1234-5678",
  "account_type": "STUDENT",
  "univ": "단국대학교",
  "major": "컴퓨터공학과",
  "member_id_number": "20231370",
  "profile_url": "https://..."
}
```

---

## 휴대폰 인증 Flow

```text
휴대폰 번호 입력
↓
GET /auth/phone/check
↓
POST /auth/phone/verification
↓
인증번호 입력
↓
POST /auth/phone/verification/confirm
↓
phone_verification_token 발급
↓
회원가입 API 호출
```

### 인증 관련 오류

| HTTP | Code | 설명 |
| --- | --- | --- |
| 409 | `PHONE_NUMBER_ALREADY_REGISTERED` | 이미 가입된 번호 |
| 429 | `PHONE_VERIFICATION_RESEND_LIMITED` | 재전송 제한 |
| 429 | `PHONE_VERIFICATION_RATE_LIMITED` | 발송 횟수 초과 |
| 400 | `PHONE_VERIFICATION_CODE_MISMATCH` | 인증번호 불일치 |
| 400 | `PHONE_VERIFICATION_CODE_EXPIRED` | 인증번호 만료 |
| 429 | `PHONE_VERIFICATION_ATTEMPTS_EXCEEDED` | 인증 실패 횟수 초과 |
| 400 | `PHONE_VERIFICATION_TOKEN_INVALID` | 인증 토큰 오류 |
| 409 | `PHONE_VERIFICATION_TOKEN_CONSUMED` | 사용된 인증 토큰 |
| 400 | `PHONE_VERIFICATION_PHONE_MISMATCH` | 인증 번호 불일치 |
| 503 | `SMS_DELIVERY_UNAVAILABLE` | SMS 발송 실패 |

---

# 2. 대시보드 API

| ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| DSH-001 | GET | `/dashboard/timetable` | 학기별 시간표 |
| DSH-002 | GET | `/dashboard/assignments` | 제출해야 할 과제 |

## DSH-001 시간표

```http
GET /api/v1/dashboard/timetable?year=2026&semester=1
```

```json
[
  {
    "space_id": "uuid",
    "space_name": "운영체제",
    "schedules": [
      {
        "day": "MONDAY",
        "start_time": "09:00",
        "end_time": "10:30",
        "classroom": "SW101"
      }
    ]
  }
]
```

---

# 3. 통합 검색 API

| ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| SCH-001 | GET | `/search` | 통합 검색 |
| SCH-002 | GET | `/search/recent` | 최근 검색어 |
| SCH-003 | DELETE | `/search/recent/{search_id}` | 검색 기록 삭제 |
| SCH-004 | DELETE | `/search/recent` | 검색 기록 전체 삭제 |
| SCH-005 | GET | `/search/recent-items` | 최근 조회 자료/질문 |

## 통합 검색

```http
GET /api/v1/search?keyword=스케줄링
```

검색 대상:

- 공지사항: 제목 / 내용
- 강의자료: 제목
- 질문: 제목 / 내용

검색 결과가 없으면 `null`이 아닌 빈 배열을 사용합니다.

```json
{
  "notices": [],
  "documents": [],
  "questions": []
}
```

---

# 4. Space API

| ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| SPC-001 | POST | `/spaces` | Space 생성 |
| SPC-002 | GET | `/spaces` | 활성 Space 조회 |
| SPC-003 | GET | `/spaces?status=ARCHIVED` | 보관 Space 조회 |
| SPC-004 | POST | `/spaces/join` | Space 참여 신청 |
| SPC-005 | PATCH | `/spaces/{space_id}` | Space 수정 |
| SPC-006 | PATCH | `/spaces/{space_id}/archive` | Space 보관 |
| SPC-007 | PATCH | `/spaces/{space_id}/restore` | Space 복원 |
| SPC-008 | DELETE | `/spaces/{space_id}` | Space 삭제 |
| SPC-009 | GET | `/spaces?membership_status=PENDING` | 승인 대기 Space |

## Space 참여

```http
POST /api/v1/spaces/join
```

```json
{
  "space_code": "A1B2C3D4"
}
```

수동 승인:

```json
{
  "space_member_id": "uuid",
  "space_id": "uuid",
  "status": "PENDING"
}
```

자동 승인:

```json
{
  "space_member_id": "uuid",
  "space_id": "uuid",
  "status": "APPROVED",
  "joined_at": "2026-08-15T12:00:00+09:00"
}
```

---

# 5. 강의자료 API

| ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| MAT-001 | GET | `/spaces/{space_id}/documents` | 강의자료 목록 |
| MAT-002 | POST | `/spaces/{space_id}/documents` | PDF 등록 |
| MAT-003 | DELETE | `/documents/{document_id}` | 강의자료 삭제 |
| MAT-004 | GET | `/documents/{document_id}/download` | PDF 다운로드 |

## 강의자료 목록

```http
GET /api/v1/spaces/{space_id}/documents
```

```json
[
  {
    "document_id": "uuid",
    "title": "운영체제 1주차",
    "thumbnail_url": "https://...",
    "page_count": 32,
    "uploaded_at": "2026-08-12T15:00:00+09:00"
  }
]
```

---

# 6. 강의자료 수정 API

| ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| MAT-005 | POST | `/documents/{document_id}/revisions` | 수정 세션 시작 |
| MAT-006 | POST | `/documents/{document_id}/revisions/{revision_id}/source-pdf` | PDF 임시 업로드 |
| MAT-007 | GET | `/documents/{document_id}/slides` | 기존 페이지 목록 |
| MAT-008 | GET | `/documents/{document_id}/revisions/{revision_id}` | 수정 상태 조회 |
| MAT-009 | POST | `/documents/{document_id}/revisions/{revision_id}/operations` | 삽입/삭제 |
| MAT-010 | POST | `.../undo` | Undo |
| MAT-011 | POST | `.../redo` | Redo |
| MAT-012 | POST | `.../complete` | 수정 완료 |
| MAT-013 | DELETE | `/documents/{document_id}/revisions/{revision_id}` | 수정 취소 |

### 프론트 처리

페이지 이탈 시 가능하면 MAT-013을 호출합니다.

```text
수정 시작
→ revision 생성
→ PDF 업로드
→ INSERT / DELETE
→ 필요 시 UNDO / REDO
→ complete
```

---

# 7. 공지사항 API

## Space 공지

| ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| NOT-001 | GET | `/spaces/{space_id}/notices` | 공지 목록 |
| NOT-002 | GET | `/notices/{notice_id}` | 공지 상세 |
| NOT-003 | POST | `/spaces/{space_id}/notices` | 공지 작성 |
| NOT-004 | PATCH | `/notices/{notice_id}` | 공지 수정 |
| NOT-005 | DELETE | `/notices/{notice_id}` | 공지 삭제 |

## 시스템 공지

| ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| SYS-NOT-001 | GET | `/system-notices` | 시스템 공지 목록 |
| SYS-NOT-002 | GET | `/system-notices/{system_notice_id}` | 시스템 공지 상세 |

---

# 8. 질문 / 답변 API

| ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| QST-001 | GET | `/spaces/{space_id}/questions` | 전체 질문 |
| QST-002 | GET | `/spaces/{space_id}/questions/mine` | 내 질문 |
| QST-003 | GET | `/spaces/{space_id}/questions/my-summary` | 내 질문 요약 |
| QST-004 | GET | `/documents/{document_id}/questions` | 자료/슬라이드 질문 |
| QST-005 | GET | `/questions/{question_id}` | 질문 상세 |
| QST-006 | POST | `/slides/{slide_id}/questions` | 슬라이드 질문 등록 |
| QST-007 | POST | `/spaces/{space_id}/questions` | 일반 질문 등록 |
| QST-008 | POST | `/spaces/{space_id}/questions/similar` | 유사 질문 조회 |
| QST-009 | DELETE | `/questions/{question_id}` | 질문 삭제 |
| QST-010 | POST | `/questions/{question_id}/answers` | 공식 답변 |
| QST-011 | PATCH | `/answers/{answer_id}` | 답변 수정 |
| QST-012 | DELETE | `/answers/{answer_id}` | 답변 삭제 |
| QST-013 | POST | `/questions/{question_id}/comments` | 댓글 작성 |
| QST-014 | PATCH | `/question-comments/{comment_id}` | 댓글 수정 |
| QST-015 | DELETE | `/question-comments/{comment_id}` | 댓글 삭제 |
| QST-016 | POST | `/questions/{question_id}/likes` | 공감 |
| QST-017 | DELETE | `/questions/{question_id}/likes` | 공감 취소 |
| QST-018 | GET | `/spaces/{space_id}/question-categories` | 카테고리 조회 |
| QST-019 | PATCH | `/spaces/{space_id}/question-categories` | 카테고리 관리 |
| QST-020 | GET | `/spaces/{space_id}/questions/export` | CSV Export |

### 질문 정렬

```text
MOST_VIEWED   → 조회순
MOST_POPULAR  → 인기순
LATEST        → 최신순
```

예:

```http
GET /api/v1/spaces/{space_id}/questions?sort=LATEST&document_id={uuid}&category_id={uuid}&size=20
```

### 질문 상태

```text
PENDING
ANSWERED
```

### 강의자료 질문 Scope

```text
ALL   → 강의자료 전체
SLIDE → 특정 슬라이드
```

특정 슬라이드:

```http
GET /api/v1/documents/{document_id}/questions?scope=SLIDE&slide_id={slide_id}
```

---

# 9. 과제 API

> 과제 관련 API는 과제 목록, 상세 조회, 등록/수정/삭제, 제출 및 채점 기능으로 구성됩니다.

프론트에서는 특히 다음 상태값을 기준으로 UI를 분기합니다.

```text
OPEN
CLOSED
```

학생 제출 상태:

```text
NOT_SUBMITTED
SUBMITTED
```

---

# 10. 멤버 API

| ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| MBR-001 | GET | `/spaces/{space_id}/members` | 멤버 목록 |
| MBR-002 | GET | `/spaces/{space_id}/members/{member_id}` | 멤버 상세 |
| MBR-003 | GET | `/spaces/{space_id}/join-requests` | 가입 요청 |
| MBR-004 | PATCH | `/spaces/{space_id}/join-requests/approve` | 가입 승인 |
| MBR-005 | PATCH | `/spaces/{space_id}/join-requests/deny` | 가입 거절 |
| MBR-006 | GET | `/spaces/{space_id}/invite-code` | 초대 코드 |
| MBR-007 | PATCH | `/spaces/{space_id}/join-settings` | 자동 승인 설정 |
| MBR-008 | DELETE | `/spaces/{space_id}/members/{member_id}` | 멤버 추방 |
| MBR-009 | PUT | `/spaces/{space_id}/members/{member_id}/role-permissions` | 역할/권한 설정 |
| MBR-010 | GET | `/spaces/{space_id}/members/{member_id}/permissions` | 조교 권한 |

### 조교 권한

| Code | 기능 |
| --- | --- |
| `MEMBER_MANAGE` | 멤버 관리 |
| `LECTURE_MATERIAL_MANAGE` | 강의자료 관리 |
| `NOTICE_MANAGE` | 공지 관리 |
| `QUESTION_MANAGE` | 질문 관리 |
| `ASSIGNMENT_MANAGE` | 과제 관리 |

프론트에서는 해당 permission을 기준으로 관리 UI를 표시합니다.

---

# 11. 알림 API

| ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| NTF-001 | GET | `/notifications` | 알림 목록 |
| NTF-002 | PATCH | `/notifications/{notification_id}/read` | 읽음 처리 |
| NTF-003 | PATCH | `/notifications/read-all` | 전체 읽음 |

### Notification Type

```text
QUESTION_CREATED
ASSIGNMENT_CLOSED
SPACE_JOIN_REQUESTED

NOTICE_CREATED
DOCUMENT_UPLOADED
QUESTION_ANSWERED
```

알림 이동에는 `target_id`를 사용합니다.

```json
{
  "notification_id": "uuid",
  "type": "DOCUMENT_UPLOADED",
  "message": "새로운 강의자료가 업로드되었습니다.",
  "space_id": "uuid",
  "target_id": "uuid",
  "is_read": false,
  "created_at": "2026-08-10T20:30:00+09:00"
}
```

---

# 12. 필기 API

| ID | Method | Endpoint | 설명 |
| --- | --- | --- | --- |
| NTE-001 | GET | `/slides/{slide_id}/private-strokes` | 개인 필기 조회 |
| NTE-002 | POST | `/slides/{slide_id}/private-strokes/sync` | 개인 필기 저장 |
| NTE-003 | GET | `/slides/{slide_id}/shared-strokes` | 공유 필기 조회 |
| NTE-004 | POST | `/slides/{slide_id}/shared-strokes/sync` | 공유 필기 저장 |
| NTE-005 | POST | `/slides/{slide_id}/fixers` | 수정 메모 작성 |
| NTE-006 | GET | `/slides/{slide_id}/fixers` | 수정 메모 조회 |
| NTE-007 | PATCH | `/fixers/{fixer_id}/check` | 수정 완료 |

### Stroke Tool

```text
PEN
HIGHLIGHTER
```

### UI Tool

```text
ERASER
Q_POINT
Q_LIST
KEYBOARD
FIXER
```

`PEN`, `HIGHLIGHTER`는 실제 stroke 데이터로 저장합니다.

`ERASER`는 기존 stroke의 DELETE operation으로 처리합니다.

---

# 13. AI / Clustering (미정)

AI Clustering API는 Spring Backend → AI Server 간 내부 API이므로 프론트엔드에서 직접 호출하지 않습니다.

```text
Frontend
    ↓
Spring Backend
    ↓
AI Service /questions/process
```

따라서 프론트에서는 질문 등록 API의 `categories` 결과만 사용합니다.

예:

```json
{
  "categories": [
    {
      "category_id": "uuid",
      "name": "CPU 스케줄링"
    },
    {
      "category_id": "uuid",
      "name": "프로세스 관리"
    }
  ]
}
```

---

# 프론트엔드 API 파일 구성 권장

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

`client.js`에서는 공통 Axios Instance와 Access Token 처리를 담당하고, 각 도메인별 파일에서는 실제 API 함수만 관리하는 구조를 권장합니다.