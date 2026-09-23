import { useEffect, useMemo, useState } from "react";

import addCategoryIcon from "../../../assets/icons/questions/add-new-category.svg";
import deleteCategoryIcon from "../../../assets/icons/questions/delete-category.svg";
import heartIcon from "../../../assets/icons/questions/heart.svg";
import selectedHeartIcon from "../../../assets/icons/questions/selected-heart.svg";
import questionSubmitIcon from "../../../assets/icons/questions/question-submit.svg";
import viewIcon from "../../../assets/icons/questions/view-count.svg";
import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import {
  createAnswer,
  getQuestionDetail,
  likeQuestion,
  unlikeQuestion,
  updateAnswer,
} from "../../lecture/api/questionApi.js";
import {
  createDocumentQuestionCategory,
  deleteQuestionCategory,
} from "../api/spaceQuestionsApi.js";
import { MOCK_QUESTION_PREVIEW_CATEGORIES } from "../mocks/questionCategoryMocks.js";
import "../styles/questionDetail.css";

function formatDetailDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
}

export default function SpaceQuestionDetail({ questionId, role, onBack, onUpdated, onCategoriesChanged }) {
  const isProfessor = role === "PROFESSOR";
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [answerContent, setAnswerContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [answerModal, setAnswerModal] = useState("");
  const [updatingLike, setUpdatingLike] = useState(false);
  const [likeError, setLikeError] = useState("");
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [hiddenMockIds, setHiddenMockIds] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    getQuestionDetail(questionId)
      .then((data) => {
        if (controller.signal.aborted) return;
        setQuestion(data);
        setAnswerContent(data?.answers?.[0]?.content ?? "");
        setError("");
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.response?.data?.message ?? "질문을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [questionId]);

  const existingAnswer = question?.answers?.[0] ?? null;
  const categories = useMemo(() => {
    if (question?.categories?.length) return question.categories;
    return MOCK_QUESTION_PREVIEW_CATEGORIES.filter((category) => !hiddenMockIds.includes(category.category_id));
  }, [question, hiddenMockIds]);

  const meta = [
    question?.document?.title,
    question?.slide?.page_number ? `${question.slide.page_number}p` : null,
    formatDetailDate(question?.created_at),
  ].filter(Boolean).join(" / ");

  function updateQuestion(nextQuestion) {
    setQuestion(nextQuestion);
    onUpdated?.(nextQuestion);
  }

  async function handleDeleteCategory(category) {
    if (category.isMock || String(category.category_id).startsWith("mock-")) {
      setHiddenMockIds((current) => [...current, category.category_id]);
      return;
    }
    setCategoryError("");
    try {
      await deleteQuestionCategory(category.category_id);
      updateQuestion({
        ...question,
        categories: (question.categories ?? []).filter((item) => item.category_id !== category.category_id),
      });
      onCategoriesChanged?.();
    } catch (cause) {
      setCategoryError(cause.response?.data?.message ?? "카테고리를 삭제하지 못했습니다.");
    }
  }

  function requestSaveAnswer() {
    if (!answerContent.trim()) return;
    setAnswerModal("confirm");
  }

  async function toggleLike() {
    if (updatingLike) return;
    const wasLiked = Boolean(question.liked);
    const previousCount = question.like_count ?? 0;
    const optimisticQuestion = {
      ...question,
      liked: !wasLiked,
      like_count: Math.max(0, previousCount + (wasLiked ? -1 : 1)),
    };

    setUpdatingLike(true);
    setLikeError("");
    updateQuestion(optimisticQuestion);
    try {
      const response = wasLiked
        ? await unlikeQuestion(questionId)
        : await likeQuestion(questionId);
      updateQuestion({ ...optimisticQuestion, ...response });
    } catch (cause) {
      updateQuestion({ ...question, liked: wasLiked, like_count: previousCount });
      setLikeError(cause.response?.data?.message ?? "공감 상태를 변경하지 못했습니다.");
    } finally {
      setUpdatingLike(false);
    }
  }

  async function saveAnswer() {
    if (saving) return;
    setSaving(true);
    setError("");
    const content = answerContent.trim();
    let saved;
    try {
      const answerId = existingAnswer?.answer_id ?? existingAnswer?.id;
      saved = answerId
        ? await updateAnswer(answerId, { content })
        : await createAnswer(questionId, { content });
    } catch (cause) {
      setError(cause.response?.data?.message ?? "답변을 저장하지 못했습니다.");
      setAnswerModal("");
      setSaving(false);
      return;
    }

    let nextCategories = question.categories ?? [];
    const categoryName = categoryDraft.trim();
    const documentId = question?.document?.document_id ?? question?.document_id;
    if (categoryName && documentId) {
      setAddingCategory(true);
      setCategoryError("");
      try {
        const category = await createDocumentQuestionCategory(documentId, categoryName);
        nextCategories = [...nextCategories, category];
        setCategoryDraft("");
        setCategoryEditorOpen(false);
        onCategoriesChanged?.();
      } catch (cause) {
        setCategoryError(cause.response?.data?.message ?? "답변은 저장되었지만 카테고리를 추가하지 못했습니다.");
      } finally {
        setAddingCategory(false);
      }
    }

    try {
      const nextAnswer = { ...existingAnswer, ...saved, content };
      updateQuestion({ ...question, answers: [nextAnswer], categories: nextCategories, status: "ANSWERED" });
      setEditing(false);
      setAnswerModal("success");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className="space-questions-content space-question-detail"><p className="space-question-detail__status">질문을 불러오는 중입니다.</p></section>;
  if (!question) return <section className="space-questions-content space-question-detail"><button type="button" className="space-question-detail__back" onClick={onBack}>← 돌아가기</button><p className="space-question-detail__status">{error}</p></section>;

  return (
    <section className="space-questions-content space-question-detail" aria-labelledby="space-question-detail-title">
      <button type="button" className="space-question-detail__back" onClick={onBack}>← 돌아가기</button>
      <header className="space-question-detail__header">
        <div>
          <h2 id="space-question-detail-title">{question.title}</h2>
          {meta && <p>{meta}</p>}
        </div>
        <div className="space-question-detail__stats" aria-label={`조회 ${question.view_count ?? 0}, 공감 ${question.like_count ?? 0}`}>
          <span><img src={viewIcon} alt="" />{question.view_count ?? 0}</span>
          <button type="button" aria-label={question.liked ? "공감 취소" : "공감하기"} aria-pressed={Boolean(question.liked)} disabled={updatingLike} onClick={toggleLike}>
            <img src={question.liked ? selectedHeartIcon : heartIcon} alt="" />{question.like_count ?? 0}
          </button>
        </div>
      </header>
      {likeError && <p className="space-question-detail__error" role="alert">{likeError}</p>}

      <div className="space-question-detail__categories">
        {categories.map((category) => <span key={category.category_id ?? category.id ?? category.name}>
          <span className="space-question-detail__category-name">{category.name ?? category.category_name}</span>
          {isProfessor && <button type="button" aria-label={`${category.name ?? category.category_name} 카테고리 삭제`} onClick={() => handleDeleteCategory(category)}><img src={deleteCategoryIcon} alt="" /></button>}
        </span>)}
        {isProfessor && categoryEditorOpen && <span className="space-question-detail__category-draft">
          <input type="text" value={categoryDraft} maxLength={50} aria-label="새 카테고리 이름" autoFocus placeholder="카테고리" onChange={(event) => setCategoryDraft(event.target.value)} />
          <button type="button" aria-label="새 카테고리 입력 취소" onClick={() => { setCategoryDraft(""); setCategoryEditorOpen(false); }}><img src={deleteCategoryIcon} alt="" /></button>
        </span>}
        {isProfessor && <button type="button" className="space-question-detail__category-add" aria-label="카테고리 추가" disabled={addingCategory || categoryEditorOpen} onClick={() => setCategoryEditorOpen(true)}><img src={addCategoryIcon} alt="" /></button>}
      </div>
      {categoryError && <p className="space-question-detail__error" role="alert">{categoryError}</p>}
      <p className="space-question-detail__content">{question.content}</p>

      {question.slide?.thumbnail_url && <div className="space-question-detail__slide" tabIndex="0" aria-label={`${question.slide.page_number ?? ""}페이지 슬라이드`}>
        <img src={question.slide.thumbnail_url} alt={`${question.document?.title ?? "강의자료"} ${question.slide.page_number ?? ""}페이지`} />
      </div>}

      {existingAnswer && !editing && <article className="space-question-detail__answer">
        <span>교수 답변</span>
        <p>{existingAnswer.content}</p>
      </article>}

      {isProfessor && editing && <>
        <div className="space-question-detail__editor">
          <span>교수 답변</span>
          <textarea value={answerContent} autoFocus onChange={(event) => setAnswerContent(event.target.value)} placeholder="질문에 대한 답변을 입력해 주세요." />
        </div>
        <div className="space-question-detail__editor-actions">
          <button type="button" onClick={() => { setEditing(false); setAnswerContent(existingAnswer?.content ?? ""); }}>취소</button>
          <button type="button" className="is-primary" disabled={!answerContent.trim()} onClick={requestSaveAnswer}>저장</button>
        </div>
      </>}

      {error && <p className="space-question-detail__error" role="alert">{error}</p>}
      {isProfessor && !editing && <button type="button" className="space-question-detail__answer-button" onClick={() => setEditing(true)}>{existingAnswer ? "답변 수정" : "답변하기"}</button>}

      {answerModal && <CompactModal
        onClose={saving ? undefined : () => setAnswerModal("")}
        labelledBy="question-answer-modal-title"
        describedBy="question-answer-modal-description"
        className="question-answer-modal"
      >
        <div className="compact-modal__icon" aria-hidden="true"><img src={questionSubmitIcon} alt="" /></div>
        <div className="compact-modal__text">
          <h2 id="question-answer-modal-title">{answerModal === "success" ? "저장되었습니다" : "답변을 저장하시겠습니까?"}</h2>
          <p id="question-answer-modal-description">{answerModal === "success" ? "질문에 답변이 저장되었습니다" : "질문에 답변을 저장합니다."}</p>
        </div>
        <ModalActions
          onCancel={() => setAnswerModal("")}
          onConfirm={answerModal === "success" ? () => setAnswerModal("") : saveAnswer}
          cancelText="취소"
          confirmText={answerModal === "success" ? "확인" : saving ? "저장 중" : "저장"}
          cancelDisabled={saving}
          confirmDisabled={saving}
          showCancel={answerModal !== "success"}
        />
      </CompactModal>}
    </section>
  );
}
