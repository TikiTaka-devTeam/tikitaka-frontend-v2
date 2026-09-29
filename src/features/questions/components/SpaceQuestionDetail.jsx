import { useEffect, useState } from "react";

import heartIcon from "../../../assets/icons/questions/heart.svg";
import selectedHeartIcon from "../../../assets/icons/questions/selected-heart.svg";
import questionSubmitIcon from "../../../assets/icons/questions/question-submit.svg";
import viewIcon from "../../../assets/icons/questions/view-count.svg";
import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import {
  createAnswer,
  createQuestionComment,
  getQuestionDetail,
  likeQuestion,
  unlikeQuestion,
  updateAnswer,
} from "../../lecture/api/questionApi.js";
import "../styles/questionDetail.css";

function formatDetailDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
}

export default function SpaceQuestionDetail({ questionId, role, onBack, onUpdated }) {
  const isProfessor = role === "PROFESSOR";
  const canCreateComment = role === "PROFESSOR" || role === "ASSISTANT";
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [answerContent, setAnswerContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [answerModal, setAnswerModal] = useState("");
  const [updatingLike, setUpdatingLike] = useState(false);
  const [likeError, setLikeError] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentError, setCommentError] = useState("");

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
  const categories = question?.categories ?? [];

  const meta = [
    question?.document?.title,
    question?.slide?.page_number ? `${question.slide.page_number}p` : null,
    formatDetailDate(question?.created_at),
  ].filter(Boolean).join(" / ");

  function updateQuestion(nextQuestion) {
    setQuestion(nextQuestion);
    onUpdated?.(nextQuestion);
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

    try {
      const nextAnswer = { ...existingAnswer, ...saved, content };
      updateQuestion({ ...question, answers: [nextAnswer], status: "ANSWERED" });
      setEditing(false);
      setAnswerModal("success");
    } finally {
      setSaving(false);
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    const content = commentContent.trim();
    if (!content || commentSaving) return;

    setCommentSaving(true);
    setCommentError("");
    try {
      const comment = await createQuestionComment(questionId, {
        content,
        parent_comment_id: null,
      });
      updateQuestion({
        ...question,
        comments: [...(question.comments ?? []), comment],
      });
      setCommentContent("");
    } catch (cause) {
      setCommentError(cause.response?.data?.message ?? cause.response?.data?.detail ?? "댓글을 등록하지 못했습니다.");
    } finally {
      setCommentSaving(false);
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
        </span>)}
      </div>
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

      {(question.comments ?? []).length > 0 && <section className="space-question-detail__comments" aria-labelledby="space-question-comments-title">
        <strong id="space-question-comments-title">댓글</strong>
        <ul>{question.comments.map((comment) => <li key={comment.comment_id ?? comment.id}>
          <p>{comment.content}</p>
        </li>)}</ul>
      </section>}

      {canCreateComment && <form className="space-question-detail__comment-composer" aria-labelledby="space-question-comment-title" onSubmit={submitComment}>
        <div className="space-question-detail__comment-heading">
          <strong id="space-question-comment-title">댓글 작성</strong>
          <small>{commentContent.length}/1000</small>
        </div>
        <textarea
          value={commentContent}
          maxLength={1000}
          rows={3}
          placeholder="댓글을 입력해 주세요."
          onChange={(event) => setCommentContent(event.target.value)}
        />
        {commentError && <p className="space-question-detail__comment-error" role="alert">{commentError}</p>}
        <button type="submit" disabled={!commentContent.trim() || commentSaving}>{commentSaving ? "등록 중" : "등록"}</button>
      </form>}

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
