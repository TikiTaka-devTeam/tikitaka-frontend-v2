import { useState } from "react";

import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import ModalBackdrop from "../../../components/common/ModalBackdrop.jsx";
import stepOneColored from "../../../assets/icons/questions/write-step1-colored.svg";
import stepTwo from "../../../assets/icons/questions/write-step2.svg";
import stepTwoColored from "../../../assets/icons/questions/write-step2-colored.svg";
import stepThree from "../../../assets/icons/questions/write-step3.svg";
import stepThreeColored from "../../../assets/icons/questions/write-step3-colored.svg";
import stepFour from "../../../assets/icons/questions/write-step4.svg";
import stepFourColored from "../../../assets/icons/questions/write-step4-colored.svg";
import stepLine from "../../../assets/icons/questions/line-between-circle.svg";
import stepLineColored from "../../../assets/icons/questions/line-between-circle-colored.svg";
import questionSubmitIcon from "../../../assets/icons/questions/question-submit.svg";
import { getQuestionDetail, getSimilarQuestions } from "../../lecture/api/questionApi.js";
import { createSpaceQuestion } from "../api/spaceQuestionsApi.js";
import "../styles/questionComposer.css";

const STEP_LABELS = ["강의자료 연결", "질문 작성", "등록", "AI 유사 질문 확인"];
const STEP_DESCRIPTIONS = [
  "질문의 맥락을 선택해요.",
  "궁금한 점을 구체적으로 적어요.",
  "질문을 등록하고 공유해요.",
  "작성한 질문과 유사한 질문을 확인해요.",
];
function readDraft(spaceId) {
  try {
    const value = JSON.parse(localStorage.getItem(`tikitaka_question_draft_${spaceId}`) || "null");
    return value && typeof value === "object" ? {
      documentId: value.documentId || "",
      title: value.title || "",
      content: value.content || "",
    } : { documentId: "", title: "", content: "" };
  } catch {
    return { documentId: "", title: "", content: "" };
  }
}

function readAuthorName() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    return user?.name ?? user?.user?.name ?? user?.nickname ?? "나";
  } catch {
    return "나";
  }
}

function StepList({ currentStep }) {
  const icons = [stepOneColored, currentStep >= 2 ? stepTwoColored : stepTwo, currentStep >= 3 ? stepThreeColored : stepThree, currentStep >= 4 ? stepFourColored : stepFour];

  return (
    <ol className="question-composer-steps">
      {STEP_LABELS.map((label, index) => (
        <li key={label} className={currentStep >= index + 1 ? "is-reached" : ""}>
          <span className="question-composer-steps__graphic">
            <img className="question-composer-steps__circle" src={icons[index]} alt="" />
            {index < 3 && <img className="question-composer-steps__line" src={currentStep > index + 1 ? stepLineColored : stepLine} alt="" />}
          </span>
          <span className="question-composer-steps__copy"><strong>{label}</strong><small>{STEP_DESCRIPTIONS[index]}</small></span>
        </li>
      ))}
    </ol>
  );
}

export default function QuestionComposer({ spaceId, documents, documentError, onReturnToMine }) {
  const [draft, setDraft] = useState(() => readDraft(spaceId));
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentDropdownOpen, setDocumentDropdownOpen] = useState(false);
  const [pendingDocumentId, setPendingDocumentId] = useState("");
  const [submitModal, setSubmitModal] = useState("");
  const [similarModalOpen, setSimilarModalOpen] = useState(false);
  const [createdQuestion, setCreatedQuestion] = useState(null);
  const [similarQuestions, setSimilarQuestions] = useState([]);
  const [similarStatus, setSimilarStatus] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const selectedDocument = documents.find((document) => (document.document_id ?? document.id) === draft.documentId);
  const pendingDocument = documents.find((document) => (document.document_id ?? document.id) === pendingDocumentId);
  const currentStep = submitModal ? 3 : createdQuestion ? 4 : draft.documentId ? 2 : 1;

  function openDocumentModal() {
    setPendingDocumentId(draft.documentId);
    setDocumentDropdownOpen(false);
    setDocumentModalOpen(true);
  }

  function saveDraft() {
    try {
      localStorage.setItem(`tikitaka_question_draft_${spaceId}`, JSON.stringify(draft));
      setDraftMessage("이 브라우저에 임시 저장되었습니다.");
      setError("");
    } catch {
      setError("임시 저장하지 못했습니다.");
    }
  }

  function requestSubmit() {
    setDraftMessage("");
    if (!draft.documentId || !draft.title.trim() || !draft.content.trim()) {
      setError("강의자료, 질문 제목, 질문 내용을 모두 입력해 주세요.");
      return;
    }
    setError("");
    setSubmitModal("confirm");
  }

  async function loadSimilarQuestions(questionId) {
    if (!questionId) return;
    setSimilarStatus("loading");
    try {
      const response = await getSimilarQuestions(questionId);
      setSimilarQuestions(response?.similar_questions ?? []);
      setSimilarStatus("ready");
    } catch {
      setSimilarStatus("error");
    }

    try {
      const detail = await getQuestionDetail(questionId);
      setCreatedQuestion((current) => current ? { ...current, ...detail } : detail);
    } catch (cause) {
      console.warn("등록한 질문의 카테고리를 갱신하지 못했습니다.", cause);
    }
  }

  async function submitQuestion() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const question = await createSpaceQuestion(spaceId, {
        document_id: draft.documentId,
        title: draft.title.trim(),
        content: draft.content.trim(),
      });
      setCreatedQuestion(question);
      void loadSimilarQuestions(question.question_id);
      try {
        localStorage.removeItem(`tikitaka_question_draft_${spaceId}`);
      } catch (storageError) {
        console.warn("질문 임시 저장 데이터를 정리하지 못했습니다.", storageError);
      }
      setSubmitModal("success");
    } catch (cause) {
      setError(cause.response?.data?.message ?? cause.response?.data?.detail ?? "질문을 등록하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewTitle = createdQuestion?.title ?? draft.title;
  const previewContent = createdQuestion?.content ?? draft.content;
  const previewCategories = createdQuestion?.categories ?? [];
  const createdAt = createdQuestion?.created_at ? new Date(createdQuestion.created_at) : new Date();
  const createdAtText = Number.isNaN(createdAt.getTime()) ? "" : `${createdAt.getMonth() + 1}월 ${createdAt.getDate()}일 ${createdAt.getHours()}:${String(createdAt.getMinutes()).padStart(2, "0")}`;

  return (
    <>
      <aside className="space-questions-sidebar question-composer-sidebar" aria-label="질문 작성 단계">
        <button type="button" className="question-composer-back" onClick={onReturnToMine}>← 내 질문</button>
        <div className="question-composer-sidebar__heading">작성 단계</div>
        <StepList currentStep={currentStep} />
        <div className="question-composer-guide">
          <strong>작성 가이드</strong>
          <ul>
            <li>한 질문에는 하나의 주제만 작성해 주세요.</li>
            <li>궁금한 점이 드러나는 구체적인 제목을 작성해 주세요.</li>
            <li>이해한 내용과 이해되지 않는 부분을 구분해 주세요.</li>
            <li>관련 강의자료의 주차와 페이지를 연결해 주세요.</li>
            <li>개인정보나 민감한 정보가 포함되지 않았는지 확인해 주세요.</li>
          </ul>
        </div>
      </aside>

      <section className="space-questions-content question-composer-content" aria-labelledby="question-composer-title">
        <div className="space-questions-content__heading">
          <h2 id="question-composer-title">질문 작성</h2>
          <p>강의자료의 맥락을 연결하면 더 정확하고 빠른 답변을 받을 수 있어요.</p>
        </div>

        {createdQuestion && !submitModal ? (
          <div className="question-composer-complete">
            <span className="question-composer-label">미리 보기</span>
            <article className="question-composer-preview">
              {previewCategories.length > 0 && <div className="question-composer-preview__categories">{previewCategories.map((category) => {
                const id = category.category_id ?? category.id;
                const name = category.name ?? category.category_name;
                return name ? <span key={id ?? name}>{name}</span> : null;
              })}</div>}
              <h3>{previewTitle}</h3>
              <p>{previewContent}</p>
              <small>{readAuthorName()} · {createdAtText}</small>
            </article>
            <div className="question-composer-similar-banner">
              <strong>{similarStatus === "ready" ? `AI 유사 질문 ${similarQuestions.length}개 발견` : "AI 유사 질문 확인"}</strong>
              <span>{similarStatus === "loading" ? "유사 질문을 찾고 있습니다." : similarStatus === "error" ? "AI 분석이 끝난 뒤 다시 시도해 주세요." : similarStatus === "ready" && similarQuestions.length === 0 ? "유사 질문이 없습니다." : "등록한 질문과 비슷한 질문을 확인해 보세요."}</span>
              {similarStatus === "error" && <button type="button" onClick={() => loadSimilarQuestions(createdQuestion.question_id)}>다시 확인</button>}
              {similarStatus === "ready" && similarQuestions.length > 0 && <button type="button" onClick={() => setSimilarModalOpen(true)}>유사 질문 보기 →</button>}
            </div>
            <button type="button" className="question-composer-return" onClick={onReturnToMine}>내 질문으로 돌아가기 →</button>
          </div>
        ) : (
          <div className="question-composer-form">
            <div className="question-composer-field">
              <span className="question-composer-label">연결할 강의자료</span>
              <div className={`question-composer-document${draft.documentId ? " is-selected" : ""}`}>
                <span>{selectedDocument?.title ?? "강의자료를 선택해주세요"}</span>
                <button type="button" onClick={openDocumentModal}>변경</button>
              </div>
            </div>
            <label className="question-composer-field">
              <span className="question-composer-label">질문 제목</span>
              <input type="text" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} maxLength={200} />
            </label>
            <label className="question-composer-field question-composer-field--content">
              <span className="question-composer-label">질문 내용</span>
              <textarea value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} />
            </label>
            {error && !submitModal && <p className="question-composer-error" role="alert">{error}</p>}
            {draftMessage && <p className="question-composer-draft-message" role="status">{draftMessage}</p>}
            <footer className="question-composer-form__footer">
              <small>질문 등록 후에는 학생이 답변을 작성할 수 없습니다.</small>
              <div>
                <button type="button" className="question-composer-secondary" onClick={saveDraft}>임시 저장</button>
                <button type="button" className="question-composer-primary" onClick={requestSubmit}>질문 등록</button>
              </div>
            </footer>
          </div>
        )}
      </section>

      {documentModalOpen && <ModalBackdrop onClose={() => setDocumentModalOpen(false)}>
        <section className="question-document-modal" role="dialog" aria-modal="true" aria-labelledby="question-document-modal-title">
          <header><h2 id="question-document-modal-title">강의자료 연결</h2><p>질문의 맥락이 되는 주차와 슬라이드를 선택하세요</p></header>
          <label className="question-composer-label" htmlFor="question-document-select">강의자료</label>
          <button id="question-document-select" type="button" className="question-document-modal__trigger" aria-expanded={documentDropdownOpen} onClick={() => setDocumentDropdownOpen((open) => !open)}>
            <span>{pendingDocument?.title ?? "강의자료를 선택해주세요"}</span><span className={`space-questions-chevron${documentDropdownOpen ? " is-open" : ""}`} />
          </button>
          {documentDropdownOpen && <div className="question-document-modal__options" role="listbox" aria-label="강의자료">
            {documents.length === 0 && <p>{documentError || "등록된 강의자료가 없습니다."}</p>}
            {documents.map((document) => {
              const id = document.document_id ?? document.id;
              return <button key={id} type="button" role="option" aria-selected={id === pendingDocumentId} className={id === pendingDocumentId ? "is-selected" : ""} onClick={() => { setPendingDocumentId(id); setDocumentDropdownOpen(false); }}>{document.title}</button>;
            })}
          </div>}
          <div className="question-document-modal__actions">
            <button type="button" className="question-composer-secondary" onClick={() => setDocumentModalOpen(false)}>취소</button>
            <button type="button" className="question-composer-primary" disabled={!pendingDocumentId} onClick={() => { setDraft((current) => ({ ...current, documentId: pendingDocumentId })); setDocumentModalOpen(false); setError(""); }}>확인</button>
          </div>
        </section>
      </ModalBackdrop>}

      {submitModal && <CompactModal
        onClose={isSubmitting ? undefined : submitModal === "success" ? () => setSubmitModal("") : () => setSubmitModal("")}
        labelledBy="question-submit-modal-title"
        describedBy="question-submit-modal-description"
        className={`question-submit-modal${error ? " question-submit-modal--error" : ""}`}
      >
        <div className="question-submit-modal__icon"><img src={questionSubmitIcon} alt="" /></div>
        <div className="question-submit-modal__copy">
          <h2 id="question-submit-modal-title">{submitModal === "success" ? "등록이 완료되었습니다" : "질문을 등록할까요?"}</h2>
          <p id="question-submit-modal-description">{submitModal === "success" ? "학생은 이후, 질문을 수정할 수 있습니다" : "질문 등록 시, 삭제 수정이 불가합니다."}</p>
          {error && <p className="question-composer-error" role="alert">{error}</p>}
        </div>
        <ModalActions
          className="question-submit-modal__actions"
          onCancel={isSubmitting ? undefined : () => { setSubmitModal(""); setError(""); }}
          onConfirm={submitModal === "success" ? () => setSubmitModal("") : submitQuestion}
          cancelText="취소"
          confirmText={submitModal === "success" ? "확인" : isSubmitting ? "등록 중" : "질문 등록"}
          confirmDisabled={isSubmitting}
          showCancel={submitModal !== "success"}
        />
      </CompactModal>}

      {similarModalOpen && <ModalBackdrop onClose={() => setSimilarModalOpen(false)}>
        <section className="question-similar-modal" role="dialog" aria-modal="true" aria-labelledby="question-similar-modal-title">
          <header><div><h2 id="question-similar-modal-title">유사 질문 확인</h2><p>AI가 작성 중인 질문과 비슷한 기존 질문을 찾아왔어요.</p></div><button type="button" aria-label="닫기" onClick={() => setSimilarModalOpen(false)}>×</button></header>
          <div className="question-similar-modal__written"><span>작성한 질문</span><strong>{previewTitle}</strong></div>
          <div className="question-similar-modal__heading"><strong>유사 질문 {similarQuestions.length}개</strong><span>유사도가 높은 질문부터 표시합니다.</span></div>
          <ul>{similarQuestions.map((question, index) => <li key={question.question_id} className={index === 0 ? "is-highlighted" : ""}><span>{Math.round((question.similarity ?? 0) * 100)}%</span><div><strong>{question.title}</strong><small>{[question.categories?.map((category) => category.name).join(", "), question.status === "ANSWERED" ? "답변 완료" : "미답변", `공감 ${question.like_count ?? 0}`].filter(Boolean).join(" · ")}</small></div></li>)}</ul>
        </section>
      </ModalBackdrop>}
    </>
  );
}
