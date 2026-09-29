# Tikitaka DB Specification

> 기준 문서: `API_SPEC.md`, 전달받은 DB 초안  
> 작성일: 2026-09-16  
> 대상 DBMS: PostgreSQL  
> 목적: 백엔드 DB 설계·마이그레이션·API 구현을 검토하기 위한 기준 문서

## 0. 문서 사용 원칙

- `API_SPEC.md`가 외부 API 계약의 기준이며, 이 문서는 그 계약을 영속화하는 DB 모델을 정의한다.
- API 응답 필드가 모두 물리 컬럼일 필요는 없다. URL, preview, count, 상태 등 계산 가능한 값은 아래의 **계산 필드** 규칙을 따른다.
- 이 문서의 **확정 필요 사항**은 구현 전에 API 또는 DB 정책을 결정해야 한다. 미확정 값을 추측해 migration에 반영하지 않는다.
- UUID PK는 별도 언급이 없으면 `UUID`, 시간은 `TIMESTAMPTZ`, 생성 시각은 `DEFAULT NOW()`를 사용한다.
- 모든 FK의 삭제 정책(`CASCADE`, `RESTRICT`, `SET NULL`)은 migration에서 명시한다. 영구 삭제 API가 있는 aggregate는 하위 테이블과 object storage 정리까지 하나의 유스케이스로 처리한다.
- `updated_at`은 애플리케이션 또는 DB trigger 중 한 방식으로 일관되게 갱신한다.

## 1. 공통 모델링 규칙

### 1.1 식별자와 API 이름

DB의 `id`는 API에서 도메인 이름을 붙여 노출한다. 예: `users.id → user_id`, `space_members.id → member_id` 또는 `space_member_id`, `space_notices.id → notice_id`.

API와 DB 이름이 다른 필드는 DTO에서 다음처럼 명시적으로 변환한다.

| API | DB | 비고 |
|---|---|---|
| `university` | `users.univ` | 사용자 API 일부는 `univ`, 멤버 API는 `university` 사용 |
| `student_number` | `users.member_id_number` | 교수의 경우 교번도 같은 컬럼 사용 |
| `uploaded_at` | `documents.created_at` | 저장 컬럼 추가 불필요 |
| `joined_at` | `space_members.approved_at` | 자동 승인도 승인 시각 기록 필요 |
| `status: ACTIVE/ARCHIVED` | `spaces.archived_at` 또는 상태 컬럼 | 5.1의 확정 필요 사항 참고 |
| `thumbnail_url`, `pdf_url` | `*_key` | object key로부터 응답 시 URL 생성 |
| `writer_name`, `author_name` | `users.name` | author FK join |

### 1.2 파일 저장

- DB에는 만료 가능한 signed URL보다 object storage key를 저장하는 방식을 권장한다.
- 기존 초안의 `file_url`, `profile_url`은 공개 고정 URL 정책이 확정된 경우에만 그대로 사용한다.
- API의 다운로드 URL은 조회 시 생성하며 URL 만료 시간과 파일명 정책은 API 명세에서 별도 확정한다.

### 1.3 상태와 카운터

- 상태 문자열에는 PostgreSQL enum 또는 `CHECK`를 적용해 허용값을 제한한다.
- `view_count`, `like_count`처럼 캐시된 카운터는 음수가 될 수 없도록 `CHECK (value >= 0)`를 둔다.
- 캐시 카운터 변경과 원본 행 변경은 같은 트랜잭션에서 처리한다.
- 소프트 삭제된 행은 기본 조회, 검색, 집계에서 제외한다.

## 2. 테이블 명세

### 2.1 사용자·인증

#### `users`

사용자 기본 정보.

| 컬럼 | 타입 | 제약/기본값 |
|---|---|---|
| `id` | UUID | PK |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL |
| `password` | VARCHAR(255) | NULL 허용(OAuth 전용 계정) |
| `name` | VARCHAR(30) | NOT NULL |
| `account_type` | VARCHAR(20) | NOT NULL, `PROFESSOR|STUDENT` |
| `phone_number` | VARCHAR(11) | UNIQUE, NOT NULL, 숫자만 저장 |
| `univ`, `major` | VARCHAR(100) | NOT NULL |
| `member_id_number` | VARCHAR(30) | NOT NULL |
| `profile_url` | TEXT | NULL 허용 |
| `status` | VARCHAR(20) | NOT NULL DEFAULT `ACTIVE`, `ACTIVE|WITHDRAWN|RESTRICTED` |
| `created_at`, `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

`phone_number`는 공백·하이픈 제거 후 저장하며 일반/OAuth 가입 모두 같은 UNIQUE 제약을 적용한다.

#### `auth`

OAuth 연결 정보: `id` PK, `user_id` FK, `provider(KAKAO|GOOGLE)`, `provider_user_id`, `created_at`.  
`UNIQUE(provider, provider_user_id)`를 적용한다. 한 사용자가 제공자별 계정을 하나만 연결하도록 할 경우 `UNIQUE(user_id, provider)`도 추가한다.

#### `phone_verifications`

휴대폰 인증 요청과 가입용 일회성 토큰을 관리한다.

- 주요 컬럼: `phone_number`, `request_ip`, `verification_code_hash`, `code_expires_at`, `attempt_count`, `resend_available_at`, `delivery_status`, `sent_at`, `failed_at`, `verified_at`, `verification_token_hash`, `token_expires_at`, `consumed_at`, `invalidated_at`.
- 인증번호 3분, 최대 실패 5회, 재전송 60초, 가입 토큰 10분 정책을 적용한다.
- 인증번호와 토큰 원문은 저장하지 않는다.
- 사용자 생성과 `consumed_at` 기록은 같은 트랜잭션에서 처리한다.
- 활성 요청 조회를 위해 `(phone_number, created_at DESC)`와 `(request_ip, created_at DESC)` 인덱스를 권장한다.

#### `tokens`

Refresh Token 회전·폐기 정보: `id`, `user_id`, `refresh_token_hash UNIQUE`, `expires_at`, `revoked_at`, timestamps. 원문은 저장하지 않으며 재발급 시 기존 토큰 폐기와 신규 토큰 생성을 한 트랜잭션에서 처리한다.

#### `inquiries`

`id`, `user_id`, `type`, `title`, `content`, `status`, timestamps.  
API 기준 `type`은 `ACCOUNT_USAGE|ERROR_REPORT|SUGGESTION_OTHER`, 초기 `status`는 `SUBMITTED`로 제한한다.

### 2.2 Space·멤버

#### `spaces`

`id`, `professor_id`, `space_name`, `year`, `semester`, `classroom`, `space_code UNIQUE`, `auto_approve`, `active_status`, `archived_at`, timestamps.

- 생성 교수도 `space_members`에 `PROFESSOR/APPROVED`로 함께 생성한다.
- `space_code`는 추측하기 어렵게 생성하고 UNIQUE 충돌 시 재시도한다.
- 영구 삭제 시 하위 데이터를 aggregate 단위로 삭제한다.

#### `schedules`

`id`, `space_id`, `day`, `start_time`, `end_time`, timestamps.  
`CHECK (start_time < end_time)` 및 `(space_id, day, start_time, end_time)` UNIQUE를 권장한다.

#### `space_members`

`id`, `space_id`, `user_id`, `color_key`, `role`, `status`, `requested_at`, `approved_at`, `denied_at`, `removed_at`, `last_accessed_at`, timestamps.

- `role`: `PROFESSOR|ASSISTANT|STUDENT`.
- `status`: 실제 정책상 `PENDING|APPROVED|DENIED|REMOVED`가 필요하다.
- 활성 중복 방지:

```sql
CREATE UNIQUE INDEX uq_space_members_active
ON space_members(space_id, user_id)
WHERE status IN ('PENDING', 'APPROVED');
```

- 승인 시 `approved_at`, 거절 시 `denied_at`, 내보내기 시 `status=REMOVED`와 `removed_at`을 함께 기록한다.

#### `space_member_permissions`

`id`, `space_member_id`, `permission`, `created_at`, `UNIQUE(space_member_id, permission)`.

허용 권한은 `MEMBER_MANAGE`, `LECTURE_MATERIAL_MANAGE`, `NOTICE_MANAGE`, `QUESTION_MANAGE`, `ASSIGNMENT_MANAGE`다. `ASSISTANT`에게만 존재할 수 있고 STUDENT 변경 시 모두 삭제한다.

### 2.3 검색·최근 항목

- `recent_searches(id, user_id, keyword, searched_at)`: `UNIQUE(user_id, keyword)`, 사용자별 최신 10개 유지.
- `recent_document_views(id, user_id, document_id, viewed_at)`: `UNIQUE(user_id, document_id)`.
- `recent_question_views(id, user_id, question_id, viewed_at)`: `UNIQUE(user_id, question_id)`.

동일 항목 재조회는 insert가 아니라 `viewed_at/searched_at` upsert로 처리한다.

### 2.4 강의자료·수정 세션

#### `documents`

`id`, `space_id`, `title`, `thumbnail_key`, `pdf_key`, `page_count`, `version`, timestamps.  
`page_count >= 0`, `version >= 1`을 보장한다. API 삭제는 영구 삭제다.

#### `slides`

`id`, `document_id`, `page_number`, `thumbnail_key`, `status(ACTIVE|PLACEHOLDER)`, timestamps.  
`UNIQUE(document_id, page_number)`, `page_number >= 1`. `PLACEHOLDER`는 원래 `slide_id`와 연결 데이터를 유지한다.

#### `document_revisions`

`id`, `document_id`, `editor_id`, `base_document_version`, `preview_version`, 임시 PDF 정보, `status VARCHAR(20) DEFAULT EDITING`, `operation_cursor_sequence`, timestamps.

- 상태: `EDITING|PROCESSING|COMPLETED|FAILED|CANCELED`.
- 문서당 `EDITING` 또는 `PROCESSING` 상태의 revision은 하나만 허용한다.
- complete 호출 직후 `PROCESSING`, 최종 PDF와 Slide 교체 완료 후 `COMPLETED`로 변경한다.
- complete 성공 시에만 document version과 최종 slide 구성을 반영한다.
- 최종 PDF·썸네일 생성, S3 업로드 또는 실제 Slide 구성 반영 실패 시 `FAILED`로 변경하고 기존 document, slide, object를 유지한다.

#### `revision_slides`

`id`, `revision_id`, `source_page_number`, `thumbnail_key`, `created_at`, `UNIQUE(revision_id, source_page_number)`.

#### `revision_pages`

`id(page_id)`, `revision_id`, `position`, `source_type`, `original_slide_id`, `revision_slide_id`, `thumbnail_key`, `status`, timestamps.

- `UNIQUE(revision_id, position)`.
- `source_type=ORIGINAL`이면 `original_slide_id`만, `REVISION`이면 `revision_slide_id`만 존재하도록 CHECK를 둔다.
- 상태는 `ACTIVE|DELETE_PENDING`.

#### `revision_operations`

`id`, `revision_id`, `client_operation_id`, `sequence`, `type`, `payload`, `inverse_payload`, `state`, `preview_version`, timestamps.

- `UNIQUE(revision_id, client_operation_id)`, `UNIQUE(revision_id, sequence)`.
- `type`: `INSERT|DELETE`; `state`: `APPLIED|UNDONE|DISCARDED`.
- operation 적용, page 변경, cursor 및 preview version 증가는 한 트랜잭션에서 원자적으로 처리한다.
- 같은 operation ID와 같은 payload는 기존 결과를 반환하고, 다른 payload면 충돌로 처리한다.

### 2.5 공지

#### `space_notices`

`id`, `space_id`, `author_id`, `title`, `content`, `view_count`, timestamps. API 기준 삭제는 영구 삭제다. `content_preview`는 저장하지 않고 생성한다.

#### `notice_files`

`id`, `notice_id`, `file_name`, `file_url` 또는 권장 `object_key`, `created_at`.

#### `notice_reads`

`(notice_id, user_id)` 복합 PK, `read_at`. 행이 없으면 미읽음이다. 상세 조회의 읽음 upsert와 조회수 증가 정책은 별도로 구분한다.

### 2.6 질문·답변

#### `question_categories`

`id`, `document_id`, `name`, `created_by`, `source`, `is_deleted`, `deleted_at`, timestamps.

- API 응답에 `source(AI|MANUAL)`가 있으므로 원본 초안과 달리 `source` 컬럼이 필요하다.
- 활성 이름 중복 방지 partial UNIQUE index: `(document_id, name) WHERE is_deleted=false`.

#### `questions`

`id`, `document_id`, nullable `slide_id`, `student_id`, `title`, `content`, nullable `x_ratio/y_ratio`, `status`, `view_count`, `like_count`, soft-delete 필드, timestamps.

- `slide_id`가 있으면 같은 document 소속이어야 한다.
- 핀 질문은 `slide_id`, `x_ratio`, `y_ratio`가 모두 있고 일반 질문은 모두 없어야 한다.
- 좌표는 `0 <= ratio <= 1` CHECK를 적용한다.
- Space는 `documents.space_id`로 파생하며 중복 저장하지 않는다.

#### 연결·반응·답변

- `question_category_mappings(question_id, category_id, created_at)`: 복합 PK. 질문과 카테고리는 같은 document 소속이어야 한다.
- `question_likes(question_id, user_id, created_at)`: 복합 PK. `questions.like_count`와 같은 트랜잭션에서 변경한다.
- `answers(id, question_id, author_id, content, is_deleted, deleted_at, timestamps)`: 공식 답변. 활성 답변 존재 여부와 질문 상태를 동기화한다.
- `question_comments(id, question_id, author_id, parent_comment_id, content, is_deleted, deleted_at, timestamps)`: parent가 같은 질문 소속이고 대댓글 깊이는 API 정책 범위를 넘지 않도록 검증한다.

### 2.7 과제·제출·성적

#### `assignments`

`id`, `space_id`, `author_id`, `title`, `description`, `due_at`, `auto_close`, `closed_at`, `max_score`, `grading_status`, `finalized_at`, `view_count`, soft-delete 필드, timestamps.

- `max_score >= 0`, `grading_status=DRAFT|FINALIZED`.
- API의 `status(OPEN|CLOSED)`, `content_preview`, 제출/채점 count는 계산한다.
- API의 `close_type=AUTO`와 DB의 `auto_close` 간 매핑은 5.1에서 확정한다.

#### 파일·제출·성적

- `assignment_files(id, assignment_id, file_name, file_url/object_key, created_at)`.
- `assignment_submissions(id, assignment_id, student_id, comment, version, status, submitted_at, timestamps)`: `UNIQUE(assignment_id, student_id)`, 상태 `SUBMITTED|LATE`.
- `submission_files(id, submission_id, file_name, file_url/object_key, created_at)`.
- `assignment_grades(id, assignment_id, student_id, score, graded_by, timestamps)`: `UNIQUE(assignment_id, student_id)`, `0 <= score <= assignments.max_score`는 서비스 로직에서 같은 트랜잭션으로 검증한다.

`NOT_SUBMITTED`는 저장하지 않고 승인된 학생과 submission을 LEFT JOIN해 계산한다. 제출 수정은 같은 row의 version을 증가시키며 파일 교체 정책을 원자적으로 적용한다.

### 2.8 알림·필기

#### `notifications`

`id`, `user_id`, nullable `space_id`, `type`, `message`, nullable `target_id`, `is_read`, `read_at`, `created_at`.

API 기준 type은 `QUESTION_CREATED|ASSIGNMENT_CLOSED|SPACE_JOIN_REQUESTED|NOTICE_CREATED|DOCUMENT_UPLOADED|QUESTION_ANSWERED`. 최근 30일은 저장 제약이 아니라 조회 조건이다.

#### 필기 layer와 stroke

- `private_layers(id, slide_id, user_id, version, timestamps)`: `UNIQUE(slide_id, user_id)`.
- `shared_layers(id, slide_id, version, timestamps)`: `slide_id UNIQUE`; 작성자별 layer가 아니라 슬라이드별 공유 layer 하나.
- `private_strokes`와 `shared_strokes`: `id`, `layer_id`, `tool`, `points`, `content`, `color`, `thickness`, `opacity`, `stroke_order`, `is_deleted`, timestamps.
- 좌표·두께·투명도 JSON/숫자 형식을 검증하고 `(layer_id, id)` UNIQUE를 둔다.

#### 필기 operation

`private_stroke_operations`와 `shared_stroke_operations`는 같은 구조를 사용한다.

`id`, `layer_id`, `client_operation_id`, `operation_type`, 정규화된 `request_payload`, nullable `client_stroke_id`, `stroke_id`, `applied_version`, `created_at`.

- `UNIQUE(layer_id, client_operation_id)`.
- CREATE에 한해 `UNIQUE(layer_id, client_stroke_id)` partial index.
- CREATE는 client stroke ID 필수, DELETE는 NULL이라는 CHECK.
- `(layer_id, stroke_id)` 복합 FK로 다른 layer의 stroke 참조를 차단한다.
- 동일 요청 재전송은 재적용하지 않는다. 동일 ID/다른 payload는 operation conflict다.
- 신규 작업이 있는 sync 배치만 layer version을 한 번 증가시킨다.
- 변경, operation 기록, version 증가는 단일 트랜잭션에서 처리한다.

#### `fixers`

`id`, `slide_id`, `professor_id`, `x_ratio`, `y_ratio`, `content`, `is_checked`, `checked_at`, timestamps. 좌표 범위 CHECK를 적용한다.

#### `push_subscriptions`

`id`, `user_id`, `endpoint UNIQUE`, `p256dh`, `auth`, timestamps. 만료된 endpoint와 회원 탈퇴 사용자의 구독은 삭제한다. 키 값은 로그에 노출하지 않는다.

## 3. API ↔ DB 매핑 검토표

| API 영역 | 주요 테이블 | 판정 | 검토 메모 |
|---|---|---|---|
| USR-001~014 | users, auth, phone_verifications, tokens, inquiries | 보완 필요 | OAuth signup token 저장/서명 방식과 inquiry enum 명시 필요 |
| DSH-001~002 | spaces, schedules, assignments, space_members | 충돌 | 시간표의 schedule별 classroom 예시와 space 단일 classroom 모델 불일치 |
| SCH-001~005 | recent_searches/views + 문서/공지/질문 | 보완 필요 | `announcements`/`notices`, `announcement_id`/`notice_id` 명칭 불일치 |
| SPC-001~008 | spaces, schedules, space_members | 보완 필요 | ACTIVE/ARCHIVED 표현과 `active_status`/`archived_at` 중복 정리 필요 |
| MAT-001~013 | documents, slides, revisions 4종 | 대체로 일치 | 비동기 complete 상태 조회와 cascade/object 정리 정책 필요 |
| NOT-001~005 | space_notices, notice_files, notice_reads | 대체로 일치 | URL 저장 정책과 조회수/읽음의 정확한 증가 규칙 필요 |
| SYS-NOT-001~002 | 없음 | 누락 | 시스템 공지·사용자별 읽음 테이블이 필요 |
| QST-001~020 | questions, categories, mappings, likes, answers, comments | 보완 필요 | category `source`가 원본 DB 초안에 누락; AI cluster 영속 모델 없음 |
| ASG-001~015 | assignments, files, submissions, grades | 보완 필요 | `close_type`, LATE 상태, 공개 후 점수 정책 명확화 필요 |
| MBR-001~010 | space_members, permissions, users | 보완 필요 | `REMOVED`, `joined_at=approved_at`, DTO 필드명 매핑 필요 |
| NTF-001~003 | notifications | 대체로 일치 | type CHECK와 target 해석 규칙 필요 |
| NTE-001~007 | layers, strokes, operations, fixers | 대체로 일치 | 충돌 응답, 도구 enum, fixer check의 토글 여부 필요 |
| AI-INTERNAL-001 | categories/mappings만 일부 대응 | 누락 | embedding, refined content, cluster/대표 질문 저장 모델 미정 |

## 4. 잘 설계된 부분

- Space 역할을 `users.account_type`과 분리해 `space_members.role`로 관리한 점은 적절하다.
- 질문의 Space를 document를 통해 파생하고 중복 저장하지 않아 무결성 관리 지점이 줄었다.
- document revision이 실제 slide를 즉시 수정하지 않고 별도 page/operation 모델을 사용해 실패 격리가 가능하다.
- 삭제된 원본 slide를 placeholder로 남겨 질문·필기·fixer의 기준 ID를 보존하는 정책이 명확하다.
- 개인/공유 필기를 layer version과 operation 멱등성 기록으로 나눈 구조는 재전송과 동시성 제어에 적합하다.
- 제출의 `NOT_SUBMITTED`, 공지 preview, UI 상태처럼 파생 가능한 값을 불필요하게 저장하지 않은 점이 좋다.

## 5. 확정 및 수정이 필요한 사항

### 5.1 구현 전 반드시 확정(P0)

1. **시스템 공지 모델 누락**  
   SYS-NOT-001/002를 구현하려면 최소 `system_notices`와 `system_notice_reads(system_notice_id, user_id, read_at)`가 필요하다.

2. **AI 클러스터 결과 영속 모델 누락**  
   AI-INTERNAL-001의 `refined_content`, 768차원 embedding, `cluster_id`, similarity, 대표 질문을 저장할 위치가 없다. pgvector 사용 여부와 category가 cluster 자체인지 별도 entity인지 확정해야 한다.

3. **강의실 cardinality 충돌**  
   DB는 `spaces.classroom` 하나지만 DSH-001 예시는 요일별로 `SW101`, `SW203`이 다르다. 실제 요구가 시간별 강의실이면 `schedules.classroom`으로 이동하고, 동일 강의실만 허용한다면 API 예시를 수정한다.

4. **카테고리 source 누락**  
   QST-018이 `AI|MANUAL`을 반환하므로 `question_categories.source`를 추가해야 한다. `created_by IS NULL`만으로 출처를 추론하지 않는다.

5. **Space 상태의 단일 기준 필요**  
   `active_status`와 `archived_at`을 함께 쓰면 모순 상태가 가능하다. `status(ACTIVE|ARCHIVED)` 하나를 쓰거나 `archived_at IS NULL`을 상태의 단일 기준으로 쓰는 것을 권장한다.

6. **멤버 상태 enum 누락**  
   정책에는 재가입 가능한 `REMOVED`가 등장하지만 컬럼 설명에는 없다. `REMOVED`를 허용하고 partial UNIQUE 및 내보내기 로직과 일치시킨다.

### 5.2 API 계약과 함께 확정(P1)

- 인증 Header/Bearer 형식과 공통 오류 JSON을 정의해야 클라이언트·서버의 예외 처리가 일관된다.
- `semester`를 문자열 enum으로 쓸지 숫자로 쓸지 통일한다. 현재 Space 응답은 문자열, 대시보드 query 예시는 숫자처럼 표현된다.
- 통합 검색의 공지 필드를 `announcements`/`announcement_id` 또는 `notices`/`notice_id` 중 하나로 통일한다.
- API `close_type`을 유지한다면 DB도 `close_type(AUTO|MANUAL)`로 표현하는 편이 명확하다. 현재 `auto_close BOOLEAN DEFAULT TRUE`는 API 확장에 취약하다.
- 과제 공통 규칙은 SubmissionStatus를 `NOT_SUBMITTED|SUBMITTED`로 설명하지만 DB는 `LATE`를 저장한다. API에 LATE를 노출할지 제거할지 결정한다.
- 질문/공지 `view_count`가 재조회마다 증가하는지, 사용자별 최초 조회만 증가하는지 정해야 한다. 후자라면 별도 view event 또는 unique read 모델이 필요하다.
- OAuth `signup_token`이 stateless signed token인지 서버 저장형인지 정한다. 저장형이면 만료·소비 컬럼이 있는 별도 테이블이 필요하다.
- QST-019의 operation별 부분 성공을 허용하는지, 전체 transaction인지 정해야 한다. 멱등성을 원하면 operation ID 기록도 필요하다.
- MAT-012의 `PROCESSING` 완료 여부는 MAT-008을 주기적으로 조회하여 확인한다.
- 필기 version 충돌의 HTTP status, error body, 최신 version/stroke 반환 여부를 정의한다.
- `FIXER` check API가 일방향 완료인지 토글인지 정의한다.
- SYS-NOT-002의 상세 응답과 읽음 처리 시점을 정의한다.
- multipart 파일 수·크기·MIME 제한과 다운로드 URL 만료/`Content-Disposition` 정책을 정의한다.

### 5.3 DB migration에서 검증(P1)

- 영구 삭제되는 Space/Document/Notice의 모든 FK에 대해 cascade 순서와 S3 정리 실패 보상 방식을 검증한다.
- revision의 활성 세션 partial UNIQUE, category 활성 이름 partial UNIQUE, stroke 복합 FK를 실제 migration에 반영한다.
- `questions.slide_id`와 `document_id`, category mapping의 document 동일성처럼 단순 FK로 보장되지 않는 교차 무결성을 service/trigger 중 어디서 검증할지 정한다.
- hot query용 인덱스: 알림 `(user_id, created_at DESC)`, 질문 목록 `(document_id, created_at DESC)`, Space 질문 조회를 위한 documents 연계, 공지 `(space_id, created_at DESC)`, 과제 `(space_id, due_at)`, layer operation `(layer_id, client_operation_id)`.
- counter와 version은 read-modify-write 대신 조건부 UPDATE 또는 row lock으로 원자 처리한다.

## 6. 권장 추가 테이블 초안

API를 현재 형태로 유지할 때 필요한 최소 추가 모델이다.

```sql
CREATE TABLE system_notices (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_important BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE system_notice_reads (
    system_notice_id UUID NOT NULL REFERENCES system_notices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (system_notice_id, user_id)
);
```

AI 저장 모델은 category/cluster 관계가 확정되지 않았으므로 이 문서에서 임의의 DDL을 제안하지 않는다.

## 7. 구현 검토 체크리스트

- [ ] 모든 enum/status가 API 값과 정확히 일치하고 CHECK 또는 enum으로 제한되는가?
- [ ] API DTO의 다른 필드명(`univ/university`, `member_id_number/student_number`)이 명시적으로 매핑되는가?
- [ ] 멱등 요청이 동일 payload에는 같은 결과, 다른 payload에는 conflict를 반환하는가?
- [ ] version/counter/승인/성적 공개 변경이 단일 트랜잭션으로 처리되는가?
- [ ] 승인된 Space 멤버와 조교 세부 권한을 모든 관련 API에서 서버가 검증하는가?
- [ ] soft delete 행이 목록·검색·집계·unique 정책에서 일관되게 제외되는가?
- [ ] 영구 삭제가 DB row, object storage, 파생 파일을 빠짐없이 정리하거나 실패를 보상하는가?
- [ ] signed URL을 영속화하지 않고 object key에서 필요 시 생성하는가?
- [ ] 커서 정렬 컬럼과 tie-breaker를 지원하는 복합 인덱스가 있는가?
- [ ] `base_version`/`base_preview_version` 충돌 시 기존 데이터를 덮어쓰지 않는가?
- [ ] document revision 실패 시 기존 PDF, slide, 연결 질문·필기가 유지되는가?
- [ ] 학생에게 DRAFT 점수가 노출되지 않고 교수 전용 API 권한이 서버에서 강제되는가?

## 8. 최종 평가

현재 DB 초안은 핵심 aggregate 분리와 revision/필기 동시성 모델이 잘 잡혀 있어 전체 구조는 양호하다. 다만 API 전체를 완전히 수용하는 확정 스키마로 보기에는 P0 항목이 남아 있다. 특히 시스템 공지와 AI 클러스터링은 단순 컬럼 보완이 아니라 테이블 설계가 필요한 누락이며, 강의실 위치와 Space 상태는 현재 형태로 구현하면 API 응답과 DB 값이 어긋날 가능성이 높다.

따라서 구현 검토 순서는 **P0 계약 확정 → migration 제약/FK 검증 → API 통합 테스트 → 동시성·멱등성 테스트**를 권장한다.
