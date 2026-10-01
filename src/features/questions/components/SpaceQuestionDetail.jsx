import { useEffect, useState } from "react";

import heartIcon from "../../../assets/icons/questions/heart.svg";
import childCommentIcon from "../../../assets/icons/questions/child-comment.svg";
import selectedHeartIcon from "../../../assets/icons/questions/selected-heart.svg";
import questionSubmitIcon from "../../../assets/icons/questions/question-submit.svg";
import viewIcon from "../../../assets/icons/questions/view-count.svg";
import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import {
  createAnswer,
  createQuestionComment,
  deleteQuestionComment,
  getQuestionDetail,
  likeQuestion,
  unlikeQuestion,
  updateAnswer,
  updateQuestionComment,
} from "../../lecture/api/questionApi.js";
import "../styles/questionDetail.css";

function formatDetailDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
}

function getCommentId(comment) {
  return comment?.comment_id ?? comment?.id ?? "";
}

function getStoredUserIdentifiers() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null") || {};
    return [
      user.member_id,
      user.memberId,
      user.space_member_id,
      user.spaceMemberId,
      user.user_id,
      user.userId,
      user.id,
      user.user?.user_id,
      user.user?.id,
    ].filter(Boolean).map(String);
  } catch {
    return [];
  }
}

function getStoredUserName() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null") || {};
    return user.name ?? user.user_name ?? user.username ??
      user.user?.name ?? user.user?.user_name ?? user.user?.username ?? "사용자";
  } catch {
    return "사용자";
  }
}

function isOwnedByCurrentUser(item) {
  if ([item?.is_mine, item?.isMine, item?.is_author, item?.isAuthor].some(Boolean)) return true;
  const currentIds = getStoredUserIdentifiers();
  const ownerIds = [
    item?.author_id,
    item?.authorId,
    item?.writer_id,
    item?.writerId,
    item?.user_id,
    item?.userId,
    item?.member_id,
    item?.memberId,
    item?.author?.user_id,
    item?.author?.member_id,
    item?.author?.id,
    item?.writer?.user_id,
    item?.writer?.member_id,
    item?.writer?.id,
    item?.user?.user_id,
    item?.user?.id,
  ].filter(Boolean).map(String);
  return currentIds.some((id) => ownerIds.includes(id));
}

function getCommentAuthorRole(comment) {
  return String(
    comment?.respondent_role ?? comment?.respondentRole ??
    comment?.respondent?.role ??
    comment?.author_role ?? comment?.authorRole ??
    comment?.writer_role ?? comment?.writerRole ??
    comment?.user_role ?? comment?.userRole ??
    comment?.author?.role ?? comment?.writer?.role ?? comment?.user?.role ?? "",
  ).toUpperCase();
}

function getCommentAuthorLabel(comment, isViewingOwnQuestion, currentSpaceRole) {
  const isCurrentUser = isOwnedByCurrentUser(comment);
  const authorRole = isCurrentUser
    ? currentSpaceRole
    : getCommentAuthorRole(comment);
  const authorName = comment?.respondent_name ?? comment?.respondentName ??
    comment?.respondent?.name ??
    comment?.author_name ?? comment?.authorName ??
    comment?.writer_name ?? comment?.writerName ??
    comment?.user_name ?? comment?.userName ??
    comment?.author?.name ?? comment?.writer?.name ?? comment?.user?.name ?? "";
  const isAnonymous = Boolean(comment?.is_anonymous ?? comment?.isAnonymous);

  if (isViewingOwnQuestion && (isCurrentUser || isAnonymous)) return getStoredUserName();
  if (authorRole === "STUDENT" || isAnonymous) return "질문자";
  if (authorName) return authorName;
  if (authorRole === "PROFESSOR") return "교수";
  if (authorRole === "ASSISTANT") return "조교";
  return "작성자";
}

function getNestedComments(comment) {
  return comment?.replies ?? comment?.children ?? comment?.child_comments ?? [];
}

function buildCommentThreads(comments) {
  const commentsById = new Map();
  const order = [];

  function collect(comment, fallbackParentId = null) {
    const id = getCommentId(comment);
    if (!id) return;
    const normalized = {
      ...comment,
      parent_comment_id:
        comment.parent_comment_id ?? comment.parentCommentId ?? fallbackParentId,
    };
    if (!commentsById.has(id)) order.push(id);
    commentsById.set(id, { ...commentsById.get(id), ...normalized });
    getNestedComments(comment).forEach((child) => collect(child, id));
  }

  (comments ?? []).forEach((comment) => collect(comment));
  const ids = new Set(order);
  return order
    .map((id) => commentsById.get(id))
    .filter((comment) => {
      const parentId = comment.parent_comment_id;
      return !parentId || !ids.has(String(parentId));
    })
    .map((comment) => ({
      comment,
      replies: order
        .map((id) => commentsById.get(id))
        .filter((child) => String(child.parent_comment_id ?? "") === String(getCommentId(comment))),
    }));
}

function updateCommentCollection(comments, targetId, updater) {
  return (comments ?? []).map((comment) => {
    const nextComment = getCommentId(comment) === targetId ? updater(comment) : comment;
    const childKey = Array.isArray(comment.replies)
      ? "replies"
      : Array.isArray(comment.children)
        ? "children"
        : Array.isArray(comment.child_comments)
          ? "child_comments"
          : null;
    if (!childKey) return nextComment;
    return {
      ...nextComment,
      [childKey]: updateCommentCollection(comment[childKey], targetId, updater),
    };
  });
}

export default function SpaceQuestionDetail({
  questionId,
  role,
  currentSpaceRole = role,
  canManageQuestions = false,
  isQuestionAuthor = false,
  onBack,
  onUpdated,
}) {
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
  const [commentContent, setCommentContent] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [replyingToId, setReplyingToId] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [commentActionId, setCommentActionId] = useState("");
  const [commentActionError, setCommentActionError] = useState("");

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
  const canCreateComment = Boolean(
    canManageQuestions || isQuestionAuthor || isOwnedByCurrentUser(question),
  );
  const isViewingOwnQuestion = Boolean(
    isQuestionAuthor || isOwnedByCurrentUser(question),
  );
  const commentThreads = buildCommentThreads(question?.comments ?? []);

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
        comments: [...(question.comments ?? []), {
          ...comment,
          author_name: comment.author_name ?? comment.authorName ?? getStoredUserName(),
          author_role: comment.author_role ?? comment.authorRole ?? currentSpaceRole,
          is_mine: true,
        }],
      });
      setCommentContent("");
    } catch (cause) {
      setCommentError(cause.response?.data?.message ?? cause.response?.data?.detail ?? "댓글을 등록하지 못했습니다.");
    } finally {
      setCommentSaving(false);
    }
  }

  async function submitReply(event, parentCommentId) {
    event.preventDefault();
    const content = replyContent.trim();
    if (!content || commentActionId) return;

    setCommentActionId(parentCommentId);
    setCommentActionError("");
    try {
      const comment = await createQuestionComment(questionId, {
        content,
        parent_comment_id: parentCommentId,
      });
      updateQuestion({
        ...question,
        comments: [...(question.comments ?? []), {
          ...comment,
          author_name: comment.author_name ?? comment.authorName ?? getStoredUserName(),
          author_role: comment.author_role ?? comment.authorRole ?? currentSpaceRole,
          parent_comment_id: comment.parent_comment_id ?? parentCommentId,
          is_mine: true,
        }],
      });
      setReplyingToId("");
      setReplyContent("");
    } catch (cause) {
      setCommentActionError(cause.response?.data?.message ?? cause.response?.data?.detail ?? "대댓글을 등록하지 못했습니다.");
    } finally {
      setCommentActionId("");
    }
  }

  function startEditingComment(comment) {
    setReplyingToId("");
    setReplyContent("");
    setEditingCommentId(getCommentId(comment));
    setEditingCommentContent(comment.content ?? "");
    setCommentActionError("");
  }

  async function saveCommentEdit(event, commentId) {
    event.preventDefault();
    const content = editingCommentContent.trim();
    if (!content || commentActionId) return;

    setCommentActionId(commentId);
    setCommentActionError("");
    try {
      const updatedComment = await updateQuestionComment(commentId, { content });
      updateQuestion({
        ...question,
        comments: updateCommentCollection(question.comments, commentId, (comment) => ({
          ...comment,
          ...updatedComment,
          content,
        })),
      });
      setEditingCommentId("");
      setEditingCommentContent("");
    } catch (cause) {
      setCommentActionError(cause.response?.data?.message ?? cause.response?.data?.detail ?? "댓글을 수정하지 못했습니다.");
    } finally {
      setCommentActionId("");
    }
  }

  async function removeComment(commentId) {
    if (commentActionId) return;
    setCommentActionId(commentId);
    setCommentActionError("");
    try {
      const deletedComment = await deleteQuestionComment(commentId);
      updateQuestion({
        ...question,
        comments: updateCommentCollection(question.comments, commentId, (comment) => ({
          ...comment,
          ...deletedComment,
          is_deleted: true,
        })),
      });
      if (editingCommentId === commentId) {
        setEditingCommentId("");
        setEditingCommentContent("");
      }
    } catch (cause) {
      setCommentActionError(cause.response?.data?.message ?? cause.response?.data?.detail ?? "댓글을 삭제하지 못했습니다.");
    } finally {
      setCommentActionId("");
    }
  }

  function renderComment(comment, isReply = false) {
    const commentId = getCommentId(comment);
    const isDeleted = Boolean(comment.is_deleted ?? comment.isDeleted);
    const isOwner = isOwnedByCurrentUser(comment);
    const canEdit = !isDeleted && Boolean(comment.can_edit ?? comment.canEdit ?? isOwner);
    const canDelete = !isDeleted && Boolean(
      comment.can_delete ?? comment.canDelete ?? (isOwner || isProfessor),
    );
    const isEditing = editingCommentId === commentId;
    const date = comment.updated_at ?? comment.updatedAt ?? comment.created_at ?? comment.createdAt;

    return <article className="space-question-detail__comment-card">
      <header className="space-question-detail__comment-meta">
        <strong>{getCommentAuthorLabel(comment, isViewingOwnQuestion, currentSpaceRole)}</strong>
        {date ? <time dateTime={date}>{formatDetailDate(date)}</time> : null}
      </header>
      {isEditing ? <form className="space-question-detail__comment-inline-form" onSubmit={(event) => saveCommentEdit(event, commentId)}>
        <textarea
          value={editingCommentContent}
          maxLength={1000}
          aria-label="댓글 수정"
          onChange={(event) => setEditingCommentContent(event.target.value)}
        />
        <div>
          <button type="button" onClick={() => { setEditingCommentId(""); setEditingCommentContent(""); }}>취소</button>
          <button type="submit" disabled={!editingCommentContent.trim() || commentActionId === commentId}>저장</button>
        </div>
      </form> : <p className={isDeleted ? "is-deleted" : ""}>{isDeleted ? "삭제된 댓글입니다." : comment.content}</p>}
      {!isEditing && !isDeleted && <div className="space-question-detail__comment-actions">
        {!isReply && canCreateComment ? <button type="button" onClick={() => {
          setEditingCommentId("");
          setEditingCommentContent("");
          setReplyingToId((current) => current === commentId ? "" : commentId);
          setReplyContent("");
          setCommentActionError("");
        }}>답글</button> : null}
        {canEdit ? <button type="button" onClick={() => startEditingComment(comment)}>수정</button> : null}
        {canDelete ? <button type="button" disabled={commentActionId === commentId} onClick={() => removeComment(commentId)}>{commentActionId === commentId ? "삭제 중" : "삭제"}</button> : null}
      </div>}
    </article>;
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

      {commentThreads.length > 0 && <section className="space-question-detail__comments" aria-labelledby="space-question-comments-title">
        <strong id="space-question-comments-title">댓글</strong>
        <ul>{commentThreads.map(({ comment, replies }) => {
          const parentCommentId = getCommentId(comment);
          return <li className="space-question-detail__comment-thread" key={parentCommentId}>
            {renderComment(comment)}
            {replyingToId === parentCommentId ? <form className="space-question-detail__reply-form" onSubmit={(event) => submitReply(event, parentCommentId)}>
              <textarea
                value={replyContent}
                maxLength={1000}
                rows={2}
                autoFocus
                placeholder="대댓글을 입력해 주세요."
                onChange={(event) => setReplyContent(event.target.value)}
              />
              <div>
                <span>{replyContent.length}/1000</span>
                <button type="button" onClick={() => { setReplyingToId(""); setReplyContent(""); }}>취소</button>
                <button type="submit" disabled={!replyContent.trim() || commentActionId === parentCommentId}>{commentActionId === parentCommentId ? "등록 중" : "등록"}</button>
              </div>
            </form> : null}
            {replies.length > 0 ? <ul className="space-question-detail__replies">
              {replies.map((reply) => <li key={getCommentId(reply)}>
                <img src={childCommentIcon} alt="" aria-hidden="true" />
                {renderComment(reply, true)}
              </li>)}
            </ul> : null}
          </li>;
        })}</ul>
        {commentActionError ? <p className="space-question-detail__comment-action-error" role="alert">{commentActionError}</p> : null}
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
