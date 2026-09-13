# Tikitaka API-SPEC

## 0. 공통 연동 규칙

- 인증 대상은 표의 “로그인 사용자/강의 참여자/교수/학생/조교” API다. 인증 Header 이름·Bearer 스킴은 PDF에 없어 백엔드 확정이 필요하다.
- JSON은 `application/json`. multipart는 `FormData`를 쓰고 boundary가 포함된 `Content-Type`을 브라우저가 설정하게 한다.
- 공통 오류 body 스키마는 **명세서에 구체 형식 없음**이다.
- 커서: 최초 `cursor` 생략 → 응답 `next_cursor`를 그대로 전달 → `has_next=false`이면 중단. 목록별 독립 관리하고 내부 값을 수정하지 않는다.
- 권한은 서버가 `APPROVED` 멤버, `role`, 조교 permission을 검증한다. 역할은 `PROFESSOR|ASSISTANT|STUDENT`다.
- 조교 권한: `MEMBER_MANAGE`, `LECTURE_MATERIAL_MANAGE`, `NOTICE_MANAGE`, `QUESTION_MANAGE`, `ASSIGNMENT_MANAGE`.
- 공지/과제 수정의 `retained_file_ids`: 생략=기존 모두 유지, `[]`=모두 삭제, 일부 ID=그 파일만 유지. `new_files`는 추가 파일.
- 필기 sync는 응답 `version`을 다음 `base_version`으로 사용한다. 버전 충돌 상태/응답은 **명세서에 구체 형식 없음**.
- 과제 UI 상태는 `AssignmentStatus(OPEN|CLOSED)`, `SubmissionStatus(NOT_SUBMITTED|SUBMITTED)`, `GradingStatus(DRAFT|FINALIZED)` 조합으로 만든다. DRAFT 점수는 학생에게 `null`.

## 1. 사용자 / 인증 API

### USR-001

- **Method/Endpoint:** `POST /api/v1/auth/oauth/{provider}`
- **권한·용도:** 전체 / OAuth 로그인 또는 신규가입 초기정보
- **Path/Query/Header:** Path `provider`; Query/Header 없음
- **Request JSON:** `{"authorization_code":"oauth-code"}`
- **Response JSON:** 기존 회원 `{"signup_required":false,"access_token":"token","refresh_token":"token","user":{"user_id":"uuid","name":"김선민","account_type":"STUDENT"}}`; 신규 `{"signup_required":true,"signup_token":"temporary-oauth-signup-token","oauth_profile":{"name":"김선민","email":null,"profile_url":null}}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 신규 `name` 필수, 이메일·이미지는 nullable.

### USR-002

- **Method/Endpoint:** `POST /api/v1/auth/oauth/signup`
- **권한·용도:** OAuth 인증 완료 비회원 / 소셜 가입
- **Path/Query/Header:** multipart; `signup_data` 필수, `profile_image` 선택
- **Request JSON part:** `{"signup_token":"temporary-oauth-signup-token","email":"student@example.com","name":"김선민","phone_number":"010-1234-5678","phone_verification_token":"phone-signup-token","account_type":"STUDENT","univ":"단국대학교","major":"컴퓨터공학과","member_id_number":"20231370"}`
- **Response JSON:** `{"access_token":"token","refresh_token":"token","user":{"user_id":"uuid","email":"student@example.com","name":"김선민","phone_number":"010-1234-5678","account_type":"STUDENT","univ":"단국대학교","major":"컴퓨터공학과","member_id_number":"20231370","profile_url":"https://..."}}`
- **상태/오류:** 이메일/휴대폰 중복 `409`; 아래 휴대폰 공통 오류. **FE:** 업로드 이미지 우선, 가입 성공 시 인증 토큰 소비.

### USR-003

- **Method/Endpoint/권한·용도:** `POST /api/v1/auth/phone/verification` / 전체 / 인증번호 발송
- **Path/Query/Header:** 없음
- **Request/Response JSON:** `{"phone_number":"010-1234-5678"}` → `{"message":"인증번호가 발송되었습니다."}`
- **상태/오류:** `409 PHONE_NUMBER_ALREADY_REGISTERED`, `429 PHONE_VERIFICATION_RESEND_LIMITED`, `429 PHONE_VERIFICATION_RATE_LIMITED`, `503 SMS_DELIVERY_UNAVAILABLE`.
- **FE:** 6자리, 3분 유효, 재전송 60초 제한.

### USR-004

- **Method/Endpoint/권한·용도:** `POST /api/v1/auth/phone/verification/confirm` / 전체 / 번호 확인
- **Path/Query/Header:** 없음
- **Request/Response JSON:** `{"phone_number":"010-1234-5678","verification_code":"123456"}` → `{"verified":true,"verification_token":"일회용 인증 토큰","expires_in":600}`
- **상태/오류:** `400 PHONE_VERIFICATION_CODE_MISMATCH`, `400 PHONE_VERIFICATION_CODE_EXPIRED`, `429 PHONE_VERIFICATION_ATTEMPTS_EXCEEDED`.
- **FE:** 토큰 10분 유효·1회 노출·가입 시 소비.

### USR-005

- **Method/Endpoint/권한·용도:** `GET /api/v1/auth/email/check?email={email}` / 비회원 / 중복 확인
- **Path/Query/Header:** Query `email`; body 없음
- **Response JSON:** `{"email":"user@example.com","available":true}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 가입의 최종 중복도 처리.

### USR-006

- **Method/Endpoint/권한·용도:** `GET /api/v1/auth/phone/check?phone_number={phone_number}` / 비회원 / 중복 확인
- **Path/Query/Header:** Query `phone_number`; body 없음
- **Response JSON:** `{"phone_number":"010-1234-5678","available":true}`
- **상태/오류:** `409 PHONE_NUMBER_ALREADY_REGISTERED`. **FE:** 확인→발송→검증→가입 순서.

### USR-007

- **Method/Endpoint/권한·용도:** `POST /api/v1/auth/signup` / 전체 / 일반 가입
- **Path/Query/Header:** multipart `signup_data` 필수, `profile_image` 선택
- **Request JSON part:** `{"email":"student@example.com","password":"Test1234!","name":"김선민","phone_number":"010-1234-5678","phone_verification_token":"phone-verification-token","account_type":"STUDENT","univ":"단국대학교","major":"컴퓨터공학과","member_id_number":"20231370"}`
- **Response JSON:** `{"user_id":"uuid","email":"student@example.com","name":"김선민","phone_number":"010-1234-5678","account_type":"STUDENT","univ":"단국대학교","major":"컴퓨터공학과","member_id_number":"20231370","profile_url":"https://..."}`
- **상태/오류:** `400 PHONE_VERIFICATION_TOKEN_INVALID`, `400 PHONE_VERIFICATION_PHONE_MISMATCH`, `409 PHONE_VERIFICATION_TOKEN_CONSUMED`, `409 PHONE_NUMBER_ALREADY_REGISTERED`.
- **FE:** 토큰과 번호 일치 필수.

### USR-008

- **Method/Endpoint/권한·용도:** `POST /api/v1/auth/login` / 전체 / 로그인
- **Path/Query/Header:** 없음
- **Request/Response JSON:** `{"email":"student@example.com","password":"Test1234!"}` → `{"access_token":"token","refresh_token":"token","user":{"user_id":"uuid","name":"김선민","account_type":"STUDENT"}}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 토큰 저장 보안 정책 별도 결정.

### USR-009

- **Method/Endpoint/권한·용도:** `POST /api/v1/auth/token/refresh` / 전체 / 재발급
- **Path/Query/Header:** 없음
- **Request/Response JSON:** `{"refresh_token":"token"}` → `{"access_token":"new-access-token","refresh_token":"new-refresh-token"}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 동시 refresh 단일화.

### USR-010

- **Method/Endpoint/권한·용도:** `POST /api/v1/auth/logout` / 로그인 사용자 / 로그아웃
- **Path/Query/Header:** 인증 Header; Path/Query 없음
- **Request/Response JSON:** `{"refresh_token":"token"}` → `{"message":"로그아웃되었습니다."}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 로컬 토큰 정리.

### USR-011

- **Method/Endpoint/권한·용도:** `PATCH /api/v1/users/me/password` / 로그인 사용자 / 비밀번호 변경
- **Path/Query/Header:** 인증 Header
- **Request/Response JSON:** `{"current_password":"Test1234!","new_password":"New1234!"}` → `{"message":"비밀번호가 변경되었습니다."}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 비밀번호 정책 미명시.

### USR-012

- **Method/Endpoint/권한·용도:** `GET /api/v1/users/me` / 로그인 사용자 / 내 정보
- **Path/Query/Header:** 인증 Header; body 없음
- **Response JSON:** `{"user_id":"uuid","email":"student@example.com","name":"김선민","phone_number":"010-1234-5678","account_type":"STUDENT","univ":"단국대학교","major":"컴퓨터공학과","member_id_number":"20231370","profile_url":"https://..."}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** `profile_url` nullable 허용.

### USR-013

- **Method/Endpoint/권한·용도:** `PATCH /api/v1/users/me/profile-image` / 로그인 사용자 / 사진 등록·삭제
- **Path/Query/Header:** 인증 Header; multipart `profile_image` 또는 `delete`
- **Request 예:** `profile_image=<binary>` 또는 `{"delete":true}`
- **Response JSON:** 등록 `{"profile_url":"https://..."}`; 삭제 `{"profile_url":null}`
- **상태/오류:** 둘 다 전달/둘 다 없음 `400`. **FE:** 상호 배타적.

### USR-014

- **Method/Endpoint/권한·용도:** `POST /api/v1/inquiries` / 로그인 사용자 / 문의
- **Path/Query/Header:** 인증 Header
- **Request JSON:** `{"type":"ERROR_REPORT","title":"강의자료 오류 문의","content":"PDF가 열리지 않습니다."}`
- **Response JSON:** `{"inquiry_id":"uuid","type":"ERROR_REPORT","status":"SUBMITTED","created_at":"2026-08-10T17:00:00Z"}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** type은 `ACCOUNT_USAGE|ERROR_REPORT|SUGGESTION_OTHER`.

## 2. 대시보드 API

### DSH-001

- **Method/Endpoint/권한·용도:** `GET /api/v1/dashboard/timetable` / 로그인 사용자 / 활성 Space 시간표
- **Path/Query/Header:** Query `year`, `semester`; 인증 Header; body 없음
- **Response JSON:** `[{"space_id":"uuid","space_name":"운영체제","schedules":[{"day":"MONDAY","start_time":"09:00","end_time":"10:30","classroom":"SW101"},{"day":"WEDNESDAY","start_time":"13:00","end_time":"14:30","classroom":"SW203"}]}]`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 예 `?year=2026&semester=1`.

### DSH-002

- **Method/Endpoint/권한·용도:** `GET /api/v1/dashboard/assignments` / 로그인 사용자 / 미마감 과제
- **Path/Query/Header:** 인증 Header; body 없음
- **Response JSON:** `{"assignments":[{"assignment_id":"uuid","space_id":"uuid","space_name":"운영체제","title":"프로세스 과제","due_at":"2026-08-15T23:59:59+09:00"}]}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** timezone offset 보존.

## 3. 통합검색 API

### SCH-001

- **Method/Endpoint/권한·용도:** `GET /api/v1/search?keyword={keyword}` / 로그인 사용자 / 통합검색
- **Path/Query/Header:** Query `keyword`; 인증 Header; body 없음
- **Response JSON:** `{"documents":[{"document_id":"uuid","space_id":"uuid","space_name":"운영체제","title":"CPU 스케줄링","thumbnail_url":"https://example.com/thumbnails/document-uuid.jpg","uploaded_at":"2026-08-01T09:00:00+09:00"}],"announcements":[{"announcement_id":"uuid","space_id":"uuid","space_name":"운영체제","title":"스케줄링 과제 제출 안내","content_preview":"스케줄링 과제의 제출 기한을 안내합니다.","created_at":"2026-08-08T10:00:00+09:00"}],"questions":[{"question_id":"uuid","space_id":"uuid","space_name":"운영체제","title":"스케줄링 알고리즘 질문","content_preview":"라운드 로빈 스케줄링에서 타임 퀀텀이...","categories":[{"category_id":"uuid-1","category_name":"프로세스"}],"created_at":"2026-08-09T13:00:00+09:00"}]}`
- **상태/오류:** 명세서에 구체 형식 없음.
- **FE:** 정상 예시는 `announcements`, 빈 결과 설명은 `notices`라 불일치한다. 백엔드 확정 필수. 공백 검색어 제외, APPROVED Space만 검색.

### SCH-002

- **Method/Endpoint/권한·용도:** `GET /api/v1/search/recent` / 로그인 사용자 / 최근 검색 최대 10개
- **Path/Query/Header:** 인증 Header; body 없음
- **Response JSON:** `[{"search_id":"uuid","keyword":"스케줄링","searched_at":"2026-08-10T16:00:00Z"}]`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 동일어는 시각 갱신.

### SCH-003

- **Method/Endpoint/권한·용도:** `DELETE /api/v1/search/recent/{search_id}` / 로그인 사용자 / 한 건 삭제
- **Path/Query/Header:** Path `search_id`; 인증 Header; body 없음
- **Response JSON:** `{"message":"검색 기록이 삭제되었습니다."}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 본인 기록만.

### SCH-004

- **Method/Endpoint/권한·용도:** `DELETE /api/v1/search/recent` / 로그인 사용자 / 전체 삭제
- **Path/Query/Header:** 인증 Header; body 없음
- **Response JSON:** `{"message":"검색 기록이 모두 삭제되었습니다."}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 성공 후 캐시 비움.

### SCH-005

- **Method/Endpoint/권한·용도:** `GET /api/v1/search/recent-items` / 로그인 사용자 / 최근 자료·질문 각 최대 3개
- **Path/Query/Header:** 인증 Header; body 없음
- **Response JSON:** `{"documents":[{"document_id":"uuid","space_id":"uuid","space_name":"운영체제","title":"CPU 스케줄링","viewed_at":"2026-08-10T15:30:00Z"}],"questions":[{"question_id":"uuid","space_id":"uuid","space_name":"운영체제","title":"라운드 로빈 질문","viewed_at":"2026-08-10T15:20:00Z"}]}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 상세 조회 시 `viewed_at` 갱신.

## 4. Space API

> 아래 항목의 Header는 인증 Header다. 별도 Query가 없으면 없음이다.

### SPC-001
- **Method/Endpoint/권한·용도:** `POST /api/v1/spaces` / 교수 / Space 생성
- **Path/Query/Header:** Path·Query 없음 / 인증
- **Request JSON:** `{"space_name":"운영체제","classroom":"SW101","schedules":[{"day":"MONDAY","start_time":"09:00","end_time":"10:30"},{"day":"WEDNESDAY","start_time":"13:00","end_time":"14:30"}]}`
- **Response JSON:** `{"space_id":"uuid","space_name":"운영체제","year":2026,"semester":"2","classroom":"SW101","schedules":[{"day":"MONDAY","start_time":"09:00","end_time":"10:30"},{"day":"WEDNESDAY","start_time":"13:00","end_time":"14:30"}],"color_key":"COLOR_1","space_code":"A1B2C3D4","status":"ACTIVE"}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** year/semester/color/code는 서버 자동. `COLOR_1~12` 순환.

### SPC-002
- **Method/Endpoint/권한·용도:** `GET /api/v1/spaces?status=ACTIVE` / 로그인 사용자 / 활성 목록
- **Path/Query/Header:** Query `status=ACTIVE` / 인증; body 없음
- **Response JSON:** 교수 `{"spaces":[{"space_id":"uuid","space_name":"운영체제","year":2026,"semester":"2","classroom":"SW101","schedules":[],"color_key":"COLOR_1","space_code":"A1B2C3D4","status":"ACTIVE"}],"pending_spaces":[]}`; 학생 `{"spaces":[{"space_id":"uuid","space_name":"운영체제","year":2026,"semester":"2","classroom":"SW101","schedules":[],"color_key":"COLOR_3","status":"ACTIVE"}],"pending_spaces":[{"space_member_id":"uuid","space_id":"uuid","space_name":"자료구조","professor_name":"김교수","year":2026,"semester":"2","classroom":"SW202","schedules":[],"color_key":"COLOR_4","status":"PENDING","requested_at":"2026-08-12T15:00:00+09:00"}]}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 교수만 `space_code`; 학생 PENDING은 별도 배열.

### SPC-003
- **Method/Endpoint/권한·용도:** `GET /api/v1/spaces?status=ARCHIVED` / 로그인 사용자 / 보관 목록
- **Path/Query/Header:** Query `status=ARCHIVED` / 인증; body 없음
- **Response JSON:** 교수 `{"spaces":[{"space_id":"uuid","space_name":"자료구조","year":2026,"semester":"1","color_key":"COLOR_2","space_code":"A1B2C3D4","status":"ARCHIVED"}],"pending_spaces":[]}`; 학생은 동일하나 `space_code` 없음.
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** APPROVED만 포함, pending은 빈 배열.

### SPC-004
- **Method/Endpoint/권한·용도:** `POST /api/v1/spaces/join` / 학생 / 코드 참여
- **Path/Query/Header:** 인증
- **Request JSON:** `{"space_code":"A1B2C3D4"}`
- **Response JSON:** 수동 `{"space_member_id":"uuid","space_id":"uuid","status":"PENDING"}`; 자동 `{"space_member_id":"uuid","space_id":"uuid","status":"APPROVED","joined_at":"2026-08-15T12:00:00+09:00"}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 응답 status로 화면 분기.

### SPC-005
- **Method/Endpoint/권한·용도:** `PATCH /api/v1/spaces/{space_id}` / 교수·권한 조교 / 일부 수정
- **Path/Query/Header:** Path `space_id` / 인증
- **Request JSON:** `{"space_name":"운영체제 심화","classroom":"SW201","schedules":[{"day":"MONDAY","start_time":"10:30","end_time":"12:00"},{"day":"WEDNESDAY","start_time":"13:30","end_time":"15:00"}]}`
- **Response JSON:** `{"space_id":"uuid","space_name":"운영체제 심화","classroom":"SW201","schedules":[{"day":"MONDAY","start_time":"10:30","end_time":"12:00"},{"day":"WEDNESDAY","start_time":"13:30","end_time":"15:00"}],"updated_at":"2026-08-11T10:49:00+09:00"}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 전달 필드만 변경.

### SPC-006
- **Method/Endpoint/권한·용도:** `PATCH /api/v1/spaces/{space_id}/archive` / 교수 / 보관
- **입력:** Path `space_id`, 인증, body 없음. **Response JSON:** `{"space_id":"uuid","status":"ARCHIVED"}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** color 유지.

### SPC-007
- **Method/Endpoint/권한·용도:** `PATCH /api/v1/spaces/{space_id}/restore` / 교수 / 복원
- **입력:** Path `space_id`, 인증, body 없음. **Response JSON:** `{"space_id":"uuid","status":"ACTIVE"}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** color 유지.

### SPC-008
- **Method/Endpoint/권한·용도:** `DELETE /api/v1/spaces/{space_id}` / 교수 / 영구 삭제
- **입력:** Path `space_id`, 인증, body 없음. **Response:** `204 No Content`.
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 비가역 확인 UI.

> `SPC-009` 별도 승인대기 API는 SPC-002에 통합. PDF의 `SPC-011`은 “PENDING만 반환” 규칙만 있고 endpoint 정의가 없다. Space status(`ACTIVE|ARCHIVED`)와 membership status(`PENDING|APPROVED|DENIED`)는 독립이다.

현재 `API-SPEC.md`의 `## 5. 강의자료 API`부터 `## 7. 공지사항 API` 직전까지를 아래 내용으로 교체하면 됩니다.

## 5. 강의자료 API

### MAT-001 - 강의자료 목록 조회

- **Method / Endpoint:** `GET /api/v1/spaces/{space_id}/documents`
- **권한:** 강의 참여자
- **용도:** Space에 등록된 강의자료 목록을 조회한다.
- **Path:** `space_id`
- **Query:** 없음
- **Request Body:** 없음
- **Response JSON:**

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

- **프론트엔드 유의사항:**
  - 강의자료가 없으면 빈 배열로 처리한다.
  - `thumbnail_url`은 PDF 첫 페이지를 변환한 썸네일 이미지 URL이다.

### MAT-002 - PDF 강의자료 등록

- **Method / Endpoint:** `POST /api/v1/spaces/{space_id}/documents`
- **권한:** 교수 또는 강의자료 관리 권한이 있는 조교
- **용도:** PDF 강의자료를 등록한다.
- **Path:** `space_id`
- **Query:** 없음
- **Content-Type:** `multipart/form-data`
- **Request:**

```text
file: week1.pdf
```

- **Response JSON:**

```json
{
  "document_id": "uuid",
  "title": "운영체제 1주차",
  "thumbnail_url": "https://...",
  "page_count": 32,
  "uploaded_at": "2026-08-12T15:00:00+09:00"
}
```

- **프론트엔드 유의사항:**
  - `FormData`에 `file` 필드로 PDF 파일을 추가한다.
  - 브라우저가 multipart boundary를 설정하도록 `Content-Type`을 직접 지정하지 않는다.
  - 문서 제목은 업로드된 PDF의 파일명 또는 서버 정책에 따라 결정된다.

### MAT-003 - 강의자료 영구 삭제

- **Method / Endpoint:** `DELETE /api/v1/documents/{document_id}`
- **권한:** 교수 또는 강의자료 관리 권한이 있는 조교
- **용도:** 강의자료와 연결 데이터를 영구 삭제한다.
- **Path:** `document_id`
- **Query:** 없음
- **Request Body:** 없음
- **Response:** `204 No Content`
- **프론트엔드 유의사항:**
  - 다음 데이터가 모두 삭제되는 비가역 작업이다.
    - 원본 PDF
    - 생성된 썸네일 이미지
    - 강의자료 페이지 정보
    - 페이지에 연결된 필기, 질문 등 관련 데이터
  - 실행 전 사용자 확인 UI를 제공한다.
  - `204` 응답에는 body가 없으므로 JSON으로 파싱하지 않는다.

### MAT-004 - 강의자료 PDF 다운로드

- **Method / Endpoint:** `GET /api/v1/documents/{document_id}/download`
- **권한:** 강의 참여자
- **용도:** 강의자료 PDF의 다운로드 URL을 조회한다.
- **Path:** `document_id`
- **Query:** 없음
- **Request Body:** 없음
- **Response JSON:**

```json
{
  "download_url": "https://..."
}
```

- **프론트엔드 유의사항:**
  - API 응답 자체는 PDF binary가 아니라 다운로드 URL이다.
  - URL 만료 시간과 파일명 처리 방식은 명세서에 구체 형식 없음.

### MAT-005 - 실제 강의자료 페이지 목록 조회

- **Method / Endpoint:** `GET /api/v1/documents/{document_id}/slides`
- **권한:** 강의 참여자
- **용도:** 현재 실제 강의자료에 반영된 페이지 목록을 조회한다.
- **Path:** `document_id`
- **Query:** 없음
- **Request Body:** 없음
- **Response JSON:**

```json
{
  "document_id": "uuid",
  "pdf_url": "https://.../document.pdf",
  "page_count": 18,
  "slides": [
    {
      "slide_id": "uuid",
      "page_number": 1,
      "status": "ACTIVE"
    },
    {
      "slide_id": "uuid",
      "page_number": 2,
      "status": "PLACEHOLDER"
    }
  ]
}
```

- **프론트엔드 유의사항:**
  - 실제 페이지 이미지는 `pdf_url`의 PDF를 기준으로 표시한다.
  - 수정 세션에서 편집 중인 임시 상태는 이 API에 반영되지 않는다.
  - `PLACEHOLDER`는 삭제된 기존 페이지의 위치와 연결 데이터를 유지하기 위한 흰 페이지다.
  - 편집 중인 미리보기는 MAT-008을 사용한다.

---

## 6. 강의자료 수정 API

### MAT-006 - 수정 세션 생성

- **Method / Endpoint:** `POST /api/v1/documents/{document_id}/revisions`
- **권한:** 교수 또는 강의자료 관리 권한이 있는 조교
- **용도:** 강의자료 수정 세션을 생성한다.
- **Path:** `document_id`
- **Query:** 없음
- **Request Body:** 없음
- **Response JSON:**

```json
{
  "revision_id": "uuid",
  "document_id": "uuid",
  "base_document_version": 3,
  "preview_version": 0,
  "status": "EDITING"
}
```

- **프론트엔드 유의사항:**
  - 기존 Slide를 기준으로 `ACTIVE` 상태의 `RevisionPage`가 생성된다.
  - 문서당 `EDITING` 또는 `PROCESSING` 상태의 활성 세션은 하나만 허용한다.
  - 이후 수정 요청에 `revision_id`를 사용한다.

### MAT-007 - 삽입용 PDF 임시 업로드

- **Method / Endpoint:** `POST /api/v1/documents/{document_id}/revisions/{revision_id}/source-pdf`
- **권한:** 수정 세션 생성자
- **용도:** 페이지 삽입에 사용할 PDF를 임시 업로드하고 페이지별 삽입 후보를 생성한다.
- **Path:** `document_id`, `revision_id`
- **Query:** 없음
- **Content-Type:** `multipart/form-data`
- **Request:**

```text
file: 운영체제_1주차_추가자료.pdf
```

- **Response JSON:**

```json
{
  "revision_id": "uuid",
  "source_file_name": "추가자료.pdf",
  "source_pdf_url": "https://...",
  "source_page_count": 20,
  "revision_slides": [
    {
      "revision_slide_id": "uuid",
      "source_page_number": 1,
      "thumbnail_url": "https://..."
    }
  ]
}
```

- **프론트엔드 유의사항:**
  - 세션당 삽입용 PDF는 하나만 허용한다.
  - 삽입 작업에는 `revision_slide_id`를 사용한다.
  - `source_page_number`는 업로드한 PDF 내부 페이지 번호다.

### MAT-008 - 수정 세션 미리보기 조회

- **Method / Endpoint:** `GET /api/v1/documents/{document_id}/revisions/{revision_id}`
- **권한:** 수정 세션 생성자 또는 문서 관리 권한 보유자
- **용도:** 수정 세션의 상태와 현재 페이지 구성을 조회한다.
- **Path:** `document_id`, `revision_id`
- **Query:** 없음
- **Request Body:** 없음
- **Response JSON:**

```json
{
  "revision_id": "uuid",
  "document_id": "uuid",
  "status": "EDITING",
  "base_document_version": 3,
  "preview_version": 4,
  "title": "운영체제 1주차",
  "preview_pages": [
    {
      "page_id": "uuid-1",
      "position": 1,
      "source_type": "ORIGINAL",
      "status": "ACTIVE",
      "thumbnail_url": "https://..."
    },
    {
      "page_id": "uuid-2",
      "position": 2,
      "source_type": "ORIGINAL",
      "status": "DELETE_PENDING",
      "thumbnail_url": "https://..."
    },
    {
      "page_id": "uuid-3",
      "position": 3,
      "source_type": "REVISION",
      "status": "ACTIVE",
      "thumbnail_url": "https://..."
    }
  ],
  "can_undo": true,
  "can_redo": false
}
```

- **프론트엔드 유의사항:**
  - `DELETE_PENDING` 페이지도 기존 위치에 유지하여 표시한다.
  - 새로고침이나 버전 충돌 후 이 응답을 기준으로 편집 화면을 복원한다.
  - 이후 변경 요청에는 현재 `preview_version`을 `base_preview_version`으로 전달한다.
  - Undo/Redo 버튼은 `can_undo`, `can_redo`를 기준으로 활성화한다.

### MAT-009 - 페이지 삽입 또는 삭제

- **Method / Endpoint:** `POST /api/v1/documents/{document_id}/revisions/{revision_id}/operations`
- **권한:** 수정 세션 생성자
- **용도:** 페이지 삽입 또는 삭제 작업 한 건을 등록한다.
- **Path:** `document_id`, `revision_id`
- **Query:** 없음
- **Request JSON - 삽입:**

```json
{
  "client_operation_id": "uuid",
  "base_preview_version": 3,
  "type": "INSERT",
  "revision_slide_ids": [
    "uuid-1",
    "uuid-2"
  ],
  "position": 5
}
```

- **Request JSON - 삭제:**

```json
{
  "client_operation_id": "uuid",
  "base_preview_version": 3,
  "type": "DELETE",
  "page_ids": [
    "uuid-1",
    "uuid-2"
  ]
}
```

- **Response JSON:**

```json
{
  "operation_id": "uuid",
  "sequence": 3,
  "preview_version": 4,
  "can_undo": true,
  "can_redo": false
}
```

- **프론트엔드 유의사항:**
  - 요청 한 건은 여러 페이지를 포함하더라도 하나의 Undo/Redo 단위다.
  - 동일한 `client_operation_id`와 동일한 내용으로 재요청하면 기존 결과를 반환한다.
  - `base_preview_version`에는 마지막 서버 응답의 `preview_version`을 사용한다.
  - 성공 후 서버가 반환한 `preview_version`과 Undo/Redo 상태를 저장한다.
  - 충돌 HTTP 상태와 오류 JSON은 명세서에 구체 형식 없음.

### MAT-010 - 마지막 작업 취소

- **Method / Endpoint:** `POST /api/v1/documents/{document_id}/revisions/{revision_id}/undo`
- **권한:** 수정 세션 생성자
- **용도:** 가장 최근에 적용된 작업 한 건을 취소한다.
- **Path:** `document_id`, `revision_id`
- **Query:** 없음
- **Request JSON:**

```json
{
  "base_preview_version": 4
}
```

- **Response JSON:**

```json
{
  "revision_id": "uuid",
  "undone_operation_id": "uuid",
  "preview_version": 5,
  "can_undo": false,
  "can_redo": true
}
```

- **프론트엔드 유의사항:**
  - 작업 종류와 관계없이 MAT-009 요청 전체를 하나의 단위로 되돌린다.
  - 서버 응답의 `preview_version`과 버튼 상태를 기준으로 UI를 갱신한다.

### MAT-011 - 취소한 작업 재실행

- **Method / Endpoint:** `POST /api/v1/documents/{document_id}/revisions/{revision_id}/redo`
- **권한:** 수정 세션 생성자
- **용도:** Undo된 작업 중 다음 작업 한 건을 다시 적용한다.
- **Path:** `document_id`, `revision_id`
- **Query:** 없음
- **Request JSON:**

```json
{
  "base_preview_version": 5
}
```

- **Response JSON:**

```json
{
  "revision_id": "uuid",
  "redone_operation_id": "uuid",
  "preview_version": 6,
  "can_undo": true,
  "can_redo": false
}
```

- **프론트엔드 유의사항:**
  - Undo 후 새 작업을 등록하면 이후 `UNDONE` 작업은 `DISCARDED` 처리된다.
  - `DISCARDED` 작업은 Redo할 수 없다.

### MAT-012 - 수정 내용 최종 반영

- **Method / Endpoint:** `POST /api/v1/documents/{document_id}/revisions/{revision_id}/complete`
- **권한:** 수정 세션 생성자
- **용도:** 현재 `RevisionPage` 상태를 기준으로 새 PDF와 실제 Slide 구성을 반영한다.
- **Path:** `document_id`, `revision_id`
- **Query:** 없음
- **Request JSON:**

```json
{
  "base_preview_version": 6
}
```

- **Response Status:** `202 Accepted`
- **Response JSON:**

```json
{
  "revision_id": "uuid",
  "document_id": "uuid",
  "status": "PROCESSING"
}
```

- **프론트엔드 유의사항:**
  - 요청 후 즉시 완료된 것이 아니라 비동기 처리 중인 상태다.
  - `PROCESSING` 상태에서는 추가 편집을 차단한다.
  - 처리 완료 여부 확인 방식은 명세서에 구체 형식 없음.
  - 완료 요청을 중복 전송하지 않도록 버튼을 비활성화한다.

### MAT-013 - 수정 세션 취소

- **Method / Endpoint:** `DELETE /api/v1/documents/{document_id}/revisions/{revision_id}`
- **권한:** 수정 세션 생성자 또는 해당 Space의 교수
- **용도:** 수정 세션을 취소하고 임시 데이터를 정리한다.
- **Path:** `document_id`, `revision_id`
- **Query:** 없음
- **Request Body:** 없음
- **Response JSON:**

```json
{
  "revision_id": "uuid",
  "status": "CANCELED"
}
```

- **프론트엔드 유의사항:**
  - 임시 PDF, 임시 썸네일, revision 하위 데이터만 삭제한다.
  - 실제 Document, Slide, 원본 PDF와 연결 데이터에는 변경사항을 반영하지 않는다.

### 수정 세션 공통 처리 규칙

- `sequence`는 INSERT와 DELETE 구분 없이 revision별로 단조 증가한다.
- MAT-009 요청 한 건은 여러 페이지를 포함하더라도 하나의 Undo/Redo 작업 단위다.
- 동일한 `client_operation_id`의 동일 요청은 기존 결과를 반환한다.
- Undo 후 새 작업을 등록하면 이후 `UNDONE` 작업은 `DISCARDED` 처리되며 Redo할 수 없다.
- `RevisionPage.position`은 `DELETE_PENDING` 페이지를 포함한 전체 편집 순서다.
- 수정 중에는 실제 Document, Slide, 원본 PDF, 질문, 필기, fixer를 변경하지 않는다.

### MAT-012 최종 반영 규칙

- `ORIGINAL + ACTIVE`: 기존 Slide를 유지한다.
- `ORIGINAL + DELETE_PENDING`: 기존 Slide ID를 유지하면서 `PLACEHOLDER`로 전환한다.
  - 최종 PDF의 같은 위치에 흰 페이지를 생성한다.
  - 기존 Slide에 연결된 질문, 필기, fixer는 유지한다.
- `REVISION + ACTIVE`: 새로운 Slide를 생성한다.
- `REVISION + DELETE_PENDING`: 최종 PDF와 Slide 구성에서 제외하며 placeholder를 만들지 않는다.
- 최종 반영은 `RevisionOperation`을 다시 실행하지 않고 `RevisionPage`의 최종 상태를 기준으로 수행한다.
- 최종 PDF 생성, 썸네일 생성, S3 업로드 또는 실제 Slide 반영에 실패하면 revision 상태를 `FAILED`로 변경한다.
- `FAILED` 상태에서는 기존 Document, Slide, 원본 PDF와 기존 Slide 연결 데이터를 변경하지 않는다.

### 자동 취소 처리

프론트엔드에서는 편집 페이지 이탈 시 MAT-013을 호출할 수 있지만, 해당 호출만으로 임시 파일 정리를 보장할 수 없다.

```text
1차: 프론트엔드에서 페이지 이탈 시 MAT-013 호출
2차: 서버가 일정 시간 이상 활동이 없는 EDITING 세션을 주기적으로 정리
```

브라우저 강제 종료나 네트워크 종료 상황에서도 임시 데이터가 남지 않도록 서버에서 만료 처리를 수행한다. 자동 만료 시간은 명세서에 구체 형식 없음.

## 7. 공지사항 API

### NOT-001
- **Method/Endpoint/권한·용도:** `GET /api/v1/spaces/{space_id}/notices` / 강의 참여자 / 목록
- **입력:** Path `space_id`, 인증, body 없음.
- **Response JSON:** `{"total_count":12,"unread_count":3,"notices":[{"notice_id":"uuid","title":"중간고사 안내","content_preview":"다음 주 중간고사를 진행합니다...","created_at":"2026-08-11T10:30:00+09:00","is_read":false}],"next_cursor":"2026-08-11T10:30:00+09:00_uuid","has_next":true}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 공통 커서 규칙.

### NOT-002
- **Method/Endpoint/권한·용도:** `GET /api/v1/notices/{notice_id}` / 강의 참여자 / 상세·읽음
- **입력:** Path `notice_id`, 인증, body 없음.
- **Response JSON:** `{"notice_id":"uuid","title":"중간고사 안내","created_at":"2026-07-20T10:30:00+09:00","author_name":"김교수","view_count":32,"is_read":true,"read_at":"2026-08-11T10:35:00+09:00","content":"다음 주 중간고사를 진행합니다.","files":[{"file_id":"uuid","file_name":"중간고사_안내.pdf","file_url":"https://..."}]}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** GET이 읽음 처리하므로 prefetch 주의.

### NOT-003
- **Method/Endpoint/권한·용도:** `POST /api/v1/spaces/{space_id}/notices` / 교수·권한 조교 / 등록
- **입력:** Path `space_id`, 인증, multipart `notice_data` 필수, `files` 선택.
- **Request JSON part:** `{"title":"중간고사 안내","content":"다음 주 시험입니다."}`
- **Response JSON:** `{"notice_id":"uuid","title":"중간고사 안내","created_at":"..."}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 복수 파일 가능.

### NOT-004
- **Method/Endpoint/권한·용도:** `PATCH /api/v1/notices/{notice_id}` / 교수·권한 조교 / 수정
- **입력:** Path `notice_id`, 인증, multipart `notice_data` 필수, `new_files` 선택.
- **Request JSON part:** `{"title":"시험 일정 변경","content":"시험일이 변경되었습니다.","retained_file_ids":["uuid1"]}`
- **Response JSON:** `{"notice_id":"uuid","title":"시험 일정 변경","content":"시험일이 변경되었습니다.","files":[{"file_id":"uuid1","file_name":"시험일정.pdf","file_url":"https://..."}],"updated_at":"..."}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** retained 규칙 준수.

### NOT-005
- **Method/Endpoint/권한·용도:** `DELETE /api/v1/notices/{notice_id}` / 교수·권한 조교 / 삭제
- **입력:** Path `notice_id`, 인증, body 없음. **Response JSON:** `{"message":"공지가 삭제되었습니다."}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 목록/상세 캐시 무효화.

### SYS-NOT-001
- **Method/Endpoint/권한·용도:** `GET /api/v1/system-notices` / 로그인 사용자 / 시스템 공지 목록
- **입력:** Query `cursor`, `size`(예 20), 인증, body 없음.
- **Response JSON:** `{"total_count":3,"unread_count":1,"system_notices":[{"system_notice_id":"uuid","title":"Tikitaka 서비스 점검 안내","content_preview":"서비스 안정화를 위한 정기 점검이 진행됩니다.","is_important":true,"is_read":false,"created_at":"2026-08-11T10:00:00+09:00"}],"next_cursor":"2026-08-11T10:00:00+09:00_uuid","has_next":false}`
- **상태/오류:** 명세서에 구체 형식 없음. **FE:** 공통 커서 규칙.

### SYS-NOT-002
- **Method/Endpoint/권한·용도:** `GET /api/v1/system-notices/{system_notice_id}` / 로그인 사용자 / 상세·읽음
- **입력:** Path `system_notice_id`, 인증, body 없음.
- **Response JSON/상태·오류:** **명세서에 구체 형식 없음**.
- **FE:** GET이 읽음 처리할 수 있으므로 prefetch 주의.

## 8. 질문 / 답변 API

> 모든 항목은 인증 Header 사용. 목록 `sort=MOST_VIEWED|MOST_POPULAR|LATEST`; 동률은 `created_at DESC`, `question_id DESC`. `scope=SLIDE`면 `slide_id` 필수.

### QST-001
- **Method/Endpoint/권한·용도:** `GET /api/v1/spaces/{space_id}/questions` / 강의 참여자 / 전체 질문
- **입력:** Path `space_id`; Query `sort,document_id,category_id,cursor,size`; body 없음.
- **Response JSON:** `{"questions":[{"question_id":"uuid","title":"CPU 스케줄링이 왜 필요한가요?","document":{"document_id":"uuid","title":"운영체제 3주차"},"slide":{"slide_id":"uuid","page_number":3,"thumbnail_url":"https://..."},"categories":[{"category_id":"uuid","name":"CPU 스케줄링"}],"created_at":"2026-08-11T10:59:00","view_count":32,"like_count":4,"status":"ANSWERED"}],"total_count":24,"next_cursor":"cursor-value","has_next":true}`
- **오류:** 명세서에 구체 형식 없음. **FE:** 커서·필터 조합별 캐시 분리.

### QST-002
- **Method/Endpoint/권한·용도:** `GET /api/v1/spaces/{space_id}/questions/mine` / 학생 / 내 질문
- **입력:** QST-001과 같은 Query. **Response JSON:** QST-001 구조(예시는 `view_count` 없이 `total_count:12,next_cursor:null,has_next:false`).
- **오류:** 명세서에 구체 형식 없음. **FE:** 학생 전용.

### QST-003
- **Method/Endpoint/권한·용도:** `GET /api/v1/spaces/{space_id}/questions/my-summary` / 학생 / 요약
- **입력:** Path `space_id`; body 없음. **Response JSON:** `{"total_count":12,"answered_count":8,"pending_count":4}`
- **오류:** 명세서에 구체 형식 없음. **FE:** count로 탭 배지 표시.

### QST-004
- **Method/Endpoint/권한·용도:** `GET /api/v1/documents/{document_id}/questions` / 강의 참여자 / 자료 질문
- **입력:** Path `document_id`; Query `scope,cursor,size`, SLIDE면 `slide_id`.
- **Response JSON:** `{"questions":[{"question_id":"uuid","title":"CPU 스케줄링이 왜 필요한가요?","content":"필요한 이유가 궁금합니다.","slide":{"slide_id":"uuid","page_number":3,"thumbnail_url":"https://..."},"categories":[{"category_id":"uuid","name":"CPU 스케줄링"}],"x_ratio":0.42,"y_ratio":0.58,"like_count":4,"status":"ANSWERED"}],"next_cursor":null,"has_next":false}`
- **오류:** 명세서에 구체 형식 없음. **FE:** scope enum 엄수.

### QST-005
- **Method/Endpoint/권한·용도:** `GET /api/v1/questions/{question_id}` / 강의 참여자 / 상세
- **입력:** Path `question_id`; body 없음.
- **Response JSON:** `{"question_id":"uuid","title":"CPU 스케줄링이 왜 필요한가요?","content":"필요한 이유가 궁금합니다.","document":{"document_id":"uuid","title":"운영체제 3주차"},"slide":{"slide_id":"uuid","page_number":3,"thumbnail_url":"https://..."},"categories":[],"x_ratio":0.42,"y_ratio":0.58,"view_count":32,"like_count":4,"liked":false,"status":"ANSWERED","answers":[],"comments":[]}`
- **오류:** 명세서에 구체 형식 없음. **FE:** 조회 시 최근 항목 갱신.

### QST-006
- **Method/Endpoint/권한·용도:** `POST /api/v1/slides/{slide_id}/questions` / 학생 / 핀 질문
- **입력 JSON:** `{"title":"CPU 스케줄링","content":"CPU 스케줄링은 왜 필요한가요?","x_ratio":0.42,"y_ratio":0.58}`
- **Response JSON:** `{"question_id":"uuid","document_id":"uuid","slide_id":"uuid","title":"CPU 스케줄링","content":"CPU 스케줄링은 왜 필요한가요?","x_ratio":0.42,"y_ratio":0.58,"categories":[{"category_id":"uuid","name":"CPU 스케줄링"}],"status":"PENDING","created_at":"2026-08-11T10:59:00"}`
- **오류:** 명세서에 구체 형식 없음. **FE:** 좌표 ratio.

### QST-007
- **Method/Endpoint/권한·용도:** `POST /api/v1/spaces/{space_id}/questions` / 학생 / 질문 페이지 등록
- **입력 JSON:** `{"document_id":"uuid","title":"CPU 스케줄링","content":"CPU 스케줄링은 왜 필요한가요?"}`
- **Response JSON:** `{"question_id":"uuid","document":{"document_id":"uuid","title":"운영체제 3주차"},"slide":null,"title":"CPU 스케줄링","content":"CPU 스케줄링은 왜 필요한가요?","categories":[{"category_id":"uuid","name":"CPU 스케줄링"}],"status":"PENDING","created_at":"2026-08-11T10:59:00"}`
- **오류:** 명세서에 구체 형식 없음. **FE:** slide nullable.

### QST-008
- **Method/Endpoint/권한·용도:** `POST /api/v1/spaces/{space_id}/questions/similar` / 학생 / 유사 질문
- **입력 JSON:** `{"document_id":"uuid","slide_id":"uuid","title":"CPU 스케줄링","content":"CPU 스케줄링은 왜 필요한가요?"}`
- **Response JSON:** `{"similar_questions":[{"question_id":"uuid","title":"CPU 스케줄링의 목적이 무엇인가요?","content":"스케줄링이 필요한 이유가...","categories":[{"category_id":"uuid","name":"CPU 스케줄링"}],"status":"ANSWERED","like_count":8,"similarity":0.92}]}`
- **오류:** 명세서에 구체 형식 없음. **FE:** 최종 등록 전 호출.

### QST-009~017

| ID | Method / Endpoint | 권한·용도 | Request JSON | Response JSON | 상태/오류·FE |
|---|---|---|---|---|---|
| QST-009 | `DELETE /api/v1/questions/{question_id}` | 교수 / 소프트 삭제 | body 없음 | `{"question_id":"uuid","is_deleted":true,"deleted_at":"2026-08-11T12:00:00"}` | 오류 명세서에 구체 형식 없음; 목록 제거 |
| QST-010 | `POST /api/v1/questions/{question_id}/answers` | 교수·권한 조교 / 공식 답변 | `{"content":"CPU 사용률을 높이고 프로세스를 효율적으로 실행하기 위해 필요합니다."}` | `{"answer_id":"uuid","question_id":"uuid","content":"...","created_at":"2026-08-11T11:40:00"}` | 오류: 명세서에 구체 형식 없음; 작성 후 상세 갱신 |
| QST-011 | `PATCH /api/v1/answers/{answer_id}` | 답변 작성자 / 수정 | `{"content":"수정된 공식 답변입니다."}` | `{"answer_id":"uuid","content":"수정된 공식 답변입니다.","updated_at":"2026-08-11T11:45:00"}` | 오류: 명세서에 구체 형식 없음 |
| QST-012 | `DELETE /api/v1/answers/{answer_id}` | 작성자·교수 / 소프트 삭제 | body 없음 | `{"answer_id":"uuid","is_deleted":true}` | 오류: 명세서에 구체 형식 없음 |
| QST-013 | `POST /api/v1/questions/{question_id}/comments` | 교수·권한 조교 / 댓글·대댓글 | `{"content":"추가 설명입니다.","parent_comment_id":null}` | `{"comment_id":"uuid","question_id":"uuid","parent_comment_id":null,"content":"추가 설명입니다.","created_at":"2026-08-11T12:00:00"}` | 대댓글은 parent UUID |
| QST-014 | `PATCH /api/v1/question-comments/{comment_id}` | 작성자 / 수정 | `{"content":"수정된 댓글입니다."}` | `{"comment_id":"uuid","content":"수정된 댓글입니다.","updated_at":"2026-08-11T12:10:00"}` | 오류: 명세서에 구체 형식 없음 |
| QST-015 | `DELETE /api/v1/question-comments/{comment_id}` | 작성자·교수 / 소프트 삭제 | body 없음 | `{"comment_id":"uuid","is_deleted":true}` | 오류: 명세서에 구체 형식 없음 |
| QST-016 | `POST /api/v1/questions/{question_id}/likes` | 강의 참여자 / 공감 | body 없음 | `{"question_id":"uuid","liked":true,"like_count":5}` | 낙관 업데이트 롤백 필요 |
| QST-017 | `DELETE /api/v1/questions/{question_id}/likes` | 강의 참여자 / 공감 취소 | body 없음 | `{"question_id":"uuid","liked":false,"like_count":4}` | 낙관 업데이트 롤백 필요 |

### QST-018
- **Method/Endpoint/권한·용도:** `GET /api/v1/spaces/{space_id}/question-categories` / 강의 참여자 / 자료별 카테고리
- **입력:** Path `space_id`; body 없음. **Response JSON:** `{"documents":[{"document_id":"document-uuid-1","title":"운영체제 3주차","categories":[{"category_id":"category-uuid-1","name":"CPU 스케줄링","source":"AI"},{"category_id":"category-uuid-2","name":"프로세스 관리","source":"MANUAL"}]},{"document_id":"document-uuid-2","title":"운영체제 4주차","categories":[]}]}`
- **오류:** 명세서에 구체 형식 없음. **FE:** source 표시 선택.

### QST-019
- **Method/Endpoint/권한·용도:** `PATCH /api/v1/spaces/{space_id}/question-categories` / 교수·권한 조교 / 일괄 저장
- **입력 JSON:** `{"operations":[{"operation_id":"op-001","type":"CREATE","document_id":"document-uuid-1","temp_id":"temp-category-1","name":"메모리"},{"operation_id":"op-002","type":"UPDATE","document_id":"document-uuid-1","category_id":"category-uuid-2","name":"가상 메모리"},{"operation_id":"op-003","type":"DELETE","document_id":"document-uuid-1","category_id":"category-uuid-3"}]}`
- **Response JSON:** `{"results":[{"operation_id":"op-001","type":"CREATE","document_id":"document-uuid-1","temp_id":"temp-category-1","category_id":"new-category-uuid","status":"SUCCESS"},{"operation_id":"op-002","type":"UPDATE","document_id":"document-uuid-1","category_id":"category-uuid-2","status":"SUCCESS"},{"operation_id":"op-003","type":"DELETE","document_id":"document-uuid-1","category_id":"category-uuid-3","status":"SUCCESS"}],"saved_at":"2026-08-11T14:30:00+09:00"}`
- **오류:** 명세서에 구체 형식 없음. **FE:** operation별 status 확인.

### QST-020
- **Method/Endpoint/권한·용도:** `GET /api/v1/spaces/{space_id}/questions/export?format=csv` / 교수·권한 조교 / CSV
- **입력:** Path `space_id`, Query `format=csv`; body 없음. **Response JSON:** `{"download_url":"https://example.com/exports/questions.csv"}`
- **오류:** 명세서에 구체 형식 없음. **FE:** URL 다운로드.

## 9. 과제 API

> 모든 API는 인증 Header. multipart의 파일은 복수 `files`다.

| ID | Method / Endpoint | 권한·용도 | Path/Query 및 Request | Response JSON | 상태/오류·FE |
|---|---|---|---|---|---|
| ASG-001 | `GET /api/v1/spaces/{space_id}/assignments` | 강의 참여자 / 목록 | Path `space_id`; body 없음 | `{"assignments":[{"assignment_id":"uuid","title":"프로세스 과제","content_preview":"프로세스 스케줄링에 대해 정리하여...","due_at":"2026-08-15T23:59:59+09:00","status":"OPEN","submission_status":"NOT_SUBMITTED"}]}` | 오류: 명세서에 구체 형식 없음; 역할별 필드 주의 |
| ASG-002 | `GET /api/v1/spaces/{space_id}/assignments/summary` | 강의 참여자 / 현황 | Path `space_id`; body 없음 | 학생 `{"not_submitted_count":1}`; 교수·조교 `{"before_deadline_count":2,"grading_pending_count":5}` | 역할별 union 타입 |
| ASG-003 | `GET /api/v1/assignments/{assignment_id}` | 강의 참여자 / 상세 | Path `assignment_id`; body 없음 | `{"assignment_id":"uuid","title":"프로세스 과제","description":"...","created_at":"2026-08-11T10:00:00+09:00","writer_name":"김교수","view_count":35,"files":[],"due_at":"2026-08-15T23:59:59+09:00","status":"OPEN","my_submission":{"submission_id":"uuid","comment":"제출합니다.","files":[],"status":"SUBMITTED","submitted_at":"2026-08-14T14:20:00+09:00"},"grading_status":"DRAFT","score":null,"max_score":100}` | DRAFT 점수 숨김 |
| ASG-004 | `POST /api/v1/spaces/{space_id}/assignments` | 교수·권한 조교 / 등록 | multipart `assignment_data={"title":"프로세스 과제","description":"...","due_at":"2026-08-15T23:59:59+09:00","close_type":"AUTO"}`, `files` 선택 | `{"assignment_id":"uuid","title":"프로세스 과제","description":"...","due_at":"...","close_type":"AUTO","status":"OPEN","files":[{"file_id":"uuid","file_name":"과제안내.pdf","file_url":"https://..."}]}` | 오류: 명세서에 구체 형식 없음 |
| ASG-005 | `PATCH /api/v1/assignments/{assignment_id}` | 교수·권한 조교 / 수정 | multipart `assignment_data`에 title,description,due_at,close_type,retained_file_ids; `new_files` | 수정된 ASG-004 구조 | retained 규칙 적용 |
| ASG-006 | `PATCH /api/v1/assignments/{assignment_id}/close` | 교수·권한 조교 / 마감 | body 없음 | `{"assignment_id":"uuid","status":"CLOSED"}` | 오류: 명세서에 구체 형식 없음 |
| ASG-007 | `DELETE /api/v1/assignments/{assignment_id}` | 교수·권한 조교 / 소프트 삭제 | body 없음 | `{"assignment_id":"uuid","is_deleted":true}` | 오류: 명세서에 구체 형식 없음 |
| ASG-008 | `POST /api/v1/assignments/{assignment_id}/submissions` | 학생 / 최초 제출 | multipart `comment`, `files` | `{"submission_id":"uuid","assignment_id":"uuid","comment":"제출합니다.","files":[{"file_id":"uuid","file_name":"과제제출.pdf","file_url":"https://..."}],"version":1,"status":"SUBMITTED","submitted_at":"2026-08-14T14:20:00+09:00"}` | 최초 제출만 |
| ASG-009 | `PUT /api/v1/assignments/{assignment_id}/submissions/me` | 학생 / 제출 수정 | multipart `comment`, `files` | ASG-008 구조, `version:2` | 서버 version 반영 |
| ASG-010 | `GET /api/v1/assignments/{assignment_id}/submissions` | 교수·권한 조교 / 제출·채점 목록 | body 없음 | `{"assignment_id":"uuid","max_score":100,"grading_status":"DRAFT","submissions":[{"student_id":"uuid1","name":"김선민","student_number":"32221234","status":"SUBMITTED","files":[],"submitted_at":"2026-09-05T14:20:00+09:00","score":null}]}` | NOT_SUBMITTED는 files `[]`, submitted_at `null` |
| ASG-011 | `GET /api/v1/assignments/{assignment_id}/submissions/download` | 교수·권한 조교 / ZIP | body 없음 | `{"download_url":"https://.../submissions.zip"}` | URL 다운로드 |
| ASG-012 | `PATCH /api/v1/assignments/{assignment_id}/max-score` | 교수·권한 조교 / 만점 | `{"max_score":120}` | `{"assignment_id":"uuid","max_score":120}` | 오류: 명세서에 구체 형식 없음 |
| ASG-013 | `PUT /api/v1/assignments/{assignment_id}/grades` | 교수·권한 조교 / 임시 성적 | `{"grades":[{"student_id":"uuid-1","score":95},{"student_id":"uuid-2","score":80},{"student_id":"uuid-3","score":null}]}` | `{"assignment_id":"uuid","saved_count":2,"ungraded_count":1,"grading_status":"DRAFT"}` | null은 미채점 |
| ASG-014 | `POST /api/v1/assignments/{assignment_id}/grades/finalize` | 교수 / 최종 공개 | body 없음 | `{"assignment_id":"uuid","grading_status":"FINALIZED","ungraded_count":0}` | 교수 전용 |
| ASG-015 | `PATCH /api/v1/assignments/{assignment_id}/grades/{student_id}` | 교수 / 공개 후 수정 | `{"score":95}` | `{"assignment_id":"uuid","student_id":"uuid","score":95,"grading_status":"FINALIZED"}` | 교수 전용 |

## 10. 멤버 API

| ID | Method / Endpoint | 권한·용도 | Request | Response JSON | 상태/오류·FE |
|---|---|---|---|---|---|
| MBR-001 | `GET /api/v1/spaces/{space_id}/members` | 참여자 / 목록 | Path `space_id`; body 없음 | `{"total_count":46,"members":[{"member_id":"uuid","name":"강민수","role":"STUDENT","student_number":"32221234","profile_url":"https://..."}]}` | 오류: 명세서에 구체 형식 없음 |
| MBR-002 | `GET /api/v1/spaces/{space_id}/members/{member_id}` | 교수·권한 조교 / 상세 | 두 Path; body 없음 | `{"member_id":"uuid","name":"강민수","university":"단국대학교 죽전캠퍼스","email":"strongminsu@dankook.ac.kr","major":"컴퓨터공학과","student_number":"32223745","role":"STUDENT","joined_at":"2026-03-02T10:30:00+09:00"}` | 오류: 명세서에 구체 형식 없음 |
| MBR-003 | `GET /api/v1/spaces/{space_id}/join-requests` | 교수·권한 조교 / 요청 목록 | body 없음 | `{"join_requests":[{"join_request_id":"uuid","user_id":"uuid","name":"강민수","student_number":"32221234","profile_url":"https://...","requested_at":"2026-03-06T13:20:00+09:00"}]}` | PENDING만 |
| MBR-004 | `PATCH /api/v1/spaces/{space_id}/join-requests/approve` | 교수·권한 조교 / 승인 | `{"join_request_ids":["uuid1","uuid2"]}` | `{"approved_count":2}` | 권한 서버 검증 |
| MBR-005 | `PATCH /api/v1/spaces/{space_id}/join-requests/deny` | 교수·권한 조교 / 거절 | `{"join_request_ids":["uuid1"]}` | `{"denied_count":1}` | DENIED 유지·학생 안내 |
| MBR-006 | `GET /api/v1/spaces/{space_id}/invite-code` | 교수·권한 조교 / 코드 | body 없음 | `{"space_id":"uuid","invite_code":"A1B2C3D4","auto_approve":true}` | 오류: 명세서에 구체 형식 없음 |
| MBR-007 | `PATCH /api/v1/spaces/{space_id}/join-settings` | 교수 / 자동승인 | `{"auto_approve":true}` | `{"space_id":"uuid","auto_approve":true}` | 교수 전용 |
| MBR-008 | `DELETE /api/v1/spaces/{space_id}/members/{member_id}` | 교수·권한 조교 / 내보내기 | body 없음 | `204 No Content` | 교수는 학생·조교, MEMBER_MANAGE 조교는 학생만; 교수·본인 불가 |
| MBR-009 | `PUT /api/v1/spaces/{space_id}/members/{member_id}/role-permissions` | 교수 / 역할·권한 | `{"role":"ASSISTANT","permissions":["MEMBER_MANAGE","LECTURE_MATERIAL_MANAGE","NOTICE_MANAGE","QUESTION_MANAGE","ASSIGNMENT_MANAGE"]}` 또는 학생 permissions `[]` | `{"member_id":"uuid","role":"ASSISTANT","permissions":["MEMBER_MANAGE","LECTURE_MATERIAL_MANAGE","NOTICE_MANAGE","QUESTION_MANAGE","ASSIGNMENT_MANAGE"]}` | 최종 전체 저장 |
| MBR-010 | `GET /api/v1/spaces/{space_id}/members/{member_id}/permissions` | 교수·해당 조교 / 권한 | body 없음 | `{"member_id":"uuid","role":"ASSISTANT","permissions":["LECTURE_MATERIAL_MANAGE","QUESTION_MANAGE"]}` | 본인/교수만 |

## 11. 알림 API

### NTF-001
- **Method/Endpoint/권한·용도:** `GET /api/v1/notifications` / 로그인 사용자 / 최근 30일 알림
- **입력:** Query `is_read,cursor,size`; 인증; body 없음.
- **Response JSON:** `{"notifications":[{"notification_id":"uuid","type":"DOCUMENT_UPLOADED","message":"운영체제(CE)에 새로운 강의자료가 업로드되었습니다.","space_id":"uuid","target_id":"uuid","is_read":false,"created_at":"2026-08-10T20:30:00+09:00"}]}`
- **오류:** 명세서에 구체 형식 없음. **FE:** target_id로 이동. type은 `QUESTION_CREATED|ASSIGNMENT_CLOSED|SPACE_JOIN_REQUESTED|NOTICE_CREATED|DOCUMENT_UPLOADED|QUESTION_ANSWERED`.

### NTF-002
- **Method/Endpoint/권한·용도:** `PATCH /api/v1/notifications/{notification_id}/read` / 로그인 사용자 / 읽음
- **입력:** Path ID; body 없음. **Response JSON:** `{"notification_id":"uuid","is_read":true}`
- **오류:** 명세서에 구체 형식 없음. **FE:** 본인 알림만.

### NTF-003
- **Method/Endpoint/권한·용도:** `PATCH /api/v1/notifications/read-all` / 로그인 사용자 / 모두 읽음
- **입력:** body 없음. **Response JSON:** `{"updated_count":5}`
- **오류:** 명세서에 구체 형식 없음. **FE:** 본인의 미읽음만.

## 12. 필기 API

### NTE-001 / NTE-003
- **Method/Endpoint:** `GET /api/v1/slides/{slide_id}/private-strokes`, `GET /api/v1/slides/{slide_id}/shared-strokes`
- **권한·용도:** 각각 본인 개인 필기 / 강의 참여자의 교수 공유 필기
- **입력:** Path `slide_id`, 인증, body 없음.
- **Response JSON:** `{"slide_id":"uuid","version":5,"strokes":[{"stroke_id":"uuid","tool":"PEN","points":[{"x_ratio":0.1,"y_ratio":0.2},{"x_ratio":0.15,"y_ratio":0.25}],"color":"#000000","thickness":2.0,"opacity":1.0,"stroke_order":1,"is_deleted":false}]}` (공유 예시는 `HIGHLIGHTER`, `#FFF176`, thickness 12, opacity 0.4)
- **오류:** 명세서에 구체 형식 없음. **FE:** version 저장, ratio 렌더링.

### NTE-002 / NTE-004
- **Method/Endpoint:** `POST /api/v1/slides/{slide_id}/private-strokes/sync`, `POST /api/v1/slides/{slide_id}/shared-strokes/sync`
- **권한·용도:** 각각 본인 / 교수·권한 조교의 일괄 저장
- **Request JSON:** `{"base_version":5,"operations":[{"client_operation_id":"uuid","type":"CREATE","stroke":{"client_stroke_id":"uuid","tool":"PEN","points":[{"x_ratio":0.1,"y_ratio":0.2}],"color":"#000000","thickness":2.0,"opacity":1.0,"stroke_order":1}},{"client_operation_id":"uuid","type":"DELETE","stroke_id":"uuid"}]}`
- **Response JSON:** `{"slide_id":"uuid","version":6,"applied_count":2,"created_strokes":[{"client_stroke_id":"uuid","stroke_id":"uuid"}]}`
- **Path/Query/Header:** Path slide ID, 인증. **오류:** 충돌 형식 없음. **FE:** 공유 CREATE는 HIGHLIGHTER 예시 가능.

### NTE-005
- **Method/Endpoint/권한·용도:** `POST /api/v1/slides/{slide_id}/fixers` / 교수 / 개인 수정 메모
- **Request JSON:** `{"x_ratio":0.42,"y_ratio":0.58,"content":"이 부분 수정 필요"}`
- **Response JSON:** `{"fixer_id":"uuid","slide_id":"uuid","x_ratio":0.42,"y_ratio":0.58,"content":"이 부분 수정 필요","is_checked":false}`
- **오류:** 명세서에 구체 형식 없음. **FE:** 교수 전용.

### NTE-006
- **Method/Endpoint/권한·용도:** `GET /api/v1/slides/{slide_id}/fixers` / 교수 / 메모 조회
- **입력:** Path ID; body 없음. **Response JSON:** `[{"fixer_id":"uuid","x_ratio":0.42,"y_ratio":0.58,"content":"이 부분 수정 필요","is_checked":false}]`
- **오류:** 명세서에 구체 형식 없음. **FE:** checked 필터는 미명시.

### NTE-007
- **Method/Endpoint/권한·용도:** `PATCH /api/v1/fixers/{fixer_id}/check` / 교수 / 완료
- **입력:** Path ID; body 없음. **Response JSON:** `{"fixer_id":"uuid","is_checked":true}`
- **오류:** 명세서에 구체 형식 없음. **FE:** 토글인지 일방향인지 미명시.

> Tool enum: `PEN,HIGHLIGHTER,ERASER,Q_POINT,Q_LIST,KEYBOARD,FIXER`. 실제 stroke 저장은 PEN/HIGHLIGHTER, ERASER는 DELETE, Q_POINT는 질문, FIXER는 fixer API, Q_LIST는 UI 기능이다.

## 13. 내부 클러스터링 API

### AI-INTERNAL-001
- **Method/Endpoint/호출 주체·용도:** `POST /questions/process` / Spring 서버 / 질문 정제·768차원 임베딩·클러스터 배정
- **Path/Query/Header:** 없음; 내부 인증 방식은 **명세서에 구체 형식 없음**.
- **Request JSON:** `{"question_id":"uuid","document_id":"uuid","content":"CPU 스케줄링 이거 왜 필요해요?"}`
- **Response JSON:** `{"question_id":"uuid","refined_content":"CPU 스케줄링이 필요한 이유는 무엇인가요?","cluster_result":{"cluster_id":"uuid","summary_title":"CPU 스케줄링 개념","similarity":0.91,"is_new_cluster":false,"is_representative":false}}`
- **상태/오류:** 명세서에 구체 형식 없음.
- **FE 유의:** 프론트가 직접 호출하지 않는다. 임계값·최대 카테고리 수는 추후 결정이며 질문은 복수 카테고리 가능.

## 14. 명세 확정이 필요한 불일치/공백

1. 인증 Header 형식과 공통 오류 JSON.
2. SCH-001의 공지 배열명이 정상 예시 `announcements`, 빈 결과 설명 `notices`로 불일치.
3. SYS-NOT-002 응답 JSON 전체.
4. MAT-012 `PROCESSING` 이후 완료 조회 방식.
5. 필기 `base_version` 충돌 HTTP 상태·응답·재시도 정책.
6. 다운로드 URL 만료, 파일명/Content-Disposition 정책.
7. multipart 최대 파일 수·크기·MIME 제한.
8. `semester`가 예시에서 문자열(`"2"`)인 반면 대시보드 Query는 숫자처럼 사용됨.
