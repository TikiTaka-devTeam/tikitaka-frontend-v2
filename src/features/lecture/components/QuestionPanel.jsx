import {
  useMemo,
  useState,
} from "react";

import CloseIcon from "../../../assets/icons/close.svg?react";
import RecordStopIcon from "../../../assets/icons/record-stop.svg?react";

function QuestionList({
  questions,
  selectedQuestionId,
  onSelectQuestion,
}) {
  if (!questions.length) {
    return (
      <div className="question-panel__empty">
        등록된 질문이 없습니다.
      </div>
    );
  }

  return (
    <div className="question-panel__list">
      {questions.map((question) => (
        <button
          type="button"
          key={question.id}
          className={
            question.id === selectedQuestionId
              ? "is-selected"
              : ""
          }
          onClick={() =>
            onSelectQuestion(question)
          }
        >
          <span
            className={`question-panel__status question-panel__status--${(
              question.status ||
              "PENDING"
            ).toLowerCase()}`}
          />

          <span className="question-panel__list-text">
            <strong>
              {question.title}
            </strong>

            <small>
              {question.status ===
              "ANSWERED"
                ? "답변 완료"
                : "미답변"}
            </small>
          </span>
        </button>
      ))}
    </div>
  );
}

function SimilarQuestionList({
  questions,
  submitting,
  onSubmitAnyway,
}) {
  if (!questions.length) {
    return null;
  }

  return (
    <div className="question-panel__similar">
      <strong>
        비슷한 질문이 있어요
      </strong>

      <div className="question-panel__similar-list">
        {questions.map((question) => {
          const id =
            question.question_id ??
            question.questionId ??
            question.id;

          const likeCount =
            question.like_count ??
            question.likeCount ??
            0;

          return (
            <article key={id}>
              <h4>
                {question.title}
              </h4>

              <p>
                {question.content}
              </p>

              <span>
                공감 {likeCount}
              </span>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        className="question-panel__force-submit"
        disabled={submitting}
        onClick={onSubmitAnyway}
      >
        그래도 질문 등록
      </button>
    </div>
  );
}

function StudentQuestionComposer({
  onCheckSimilar,
  onSubmit,
}) {
  const [title, setTitle] =
    useState("");

  const [content, setContent] =
    useState("");

  const [
    similarQuestions,
    setSimilarQuestions,
  ] = useState([]);

  const [
    checking,
    setChecking,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  async function submitQuestion(
    payload,
  ) {
    setSubmitting(true);

    try {
      await onSubmit(payload);

      setTitle("");
      setContent("");
      setSimilarQuestions([]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    const trimmedTitle =
      title.trim();

    const trimmedContent =
      content.trim();

    if (
      !trimmedTitle ||
      !trimmedContent
    ) {
      return;
    }

    setChecking(true);

    try {
      const questions =
        await onCheckSimilar({
          title: trimmedTitle,
          content: trimmedContent,
        });

      if (questions.length) {
        setSimilarQuestions(
          questions,
        );

        return;
      }

      await submitQuestion({
        title: trimmedTitle,
        content: trimmedContent,
      });
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmitAnyway() {
    const trimmedTitle =
      title.trim();

    const trimmedContent =
      content.trim();

    if (
      !trimmedTitle ||
      !trimmedContent
    ) {
      return;
    }

    await submitQuestion({
      title: trimmedTitle,
      content: trimmedContent,
    });
  }

  return (
    <form
      className="question-panel__composer"
      onSubmit={handleSubmit}
    >
      <label>
        <span>
          질문 제목
        </span>

        <input
          value={title}
          maxLength={120}
          placeholder="질문 제목을 입력해주세요"
          onChange={(event) => {
            setTitle(
              event.target.value,
            );

            if (
              similarQuestions.length
            ) {
              setSimilarQuestions(
                [],
              );
            }
          }}
        />
      </label>

      <label>
        <span>
          질문 내용
        </span>

        <textarea
          value={content}
          placeholder="질문 내용을 입력해주세요"
          onChange={(event) => {
            setContent(
              event.target.value,
            );

            if (
              similarQuestions.length
            ) {
              setSimilarQuestions(
                [],
              );
            }
          }}
        />
      </label>

      <SimilarQuestionList
        questions={
          similarQuestions
        }
        submitting={submitting}
        onSubmitAnyway={
          handleSubmitAnyway
        }
      />

      <button
        type="submit"
        className="question-panel__submit"
        disabled={
          !title.trim() ||
          !content.trim() ||
          checking ||
          submitting
        }
      >
        {checking
          ? "확인 중"
          : submitting
            ? "등록 중"
            : "등록"}
      </button>
    </form>
  );
}

function ProfessorAnswerEditor({
  question,
  onSubmitAnswer,
  onVoiceStop,
}) {
  const existingAnswer =
    question?.answers?.[0] ??
    null;

  const [mode, setMode] =
    useState("TEXT");

  const [content, setContent] =
    useState(
      existingAnswer?.content ??
        "",
    );

  const [saving, setSaving] =
    useState(false);

  const voiceEnabled =
    typeof onVoiceStop ===
    "function";

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    const trimmed =
      content.trim();

    if (!trimmed) {
      return;
    }

    setSaving(true);

    try {
      await onSubmitAnswer({
        answer:
          existingAnswer,

        content:
          trimmed,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="question-panel__answer-area">
      <div className="question-panel__answer-tabs">
        <button
          type="button"
          className={
            mode === "TEXT"
              ? "is-active"
              : ""
          }
          onClick={() =>
            setMode("TEXT")
          }
        >
          텍스트 답변
        </button>

        <button
          type="button"
          className={
            mode === "VOICE"
              ? "is-active"
              : ""
          }
          onClick={() =>
            setMode("VOICE")
          }
        >
          음성 답변
        </button>
      </div>

      {mode === "TEXT" ? (
        <form
          className="question-panel__answer-form"
          onSubmit={handleSubmit}
        >
          <textarea
            value={content}
            placeholder="답변을 입력해주세요"
            onChange={(event) =>
              setContent(
                event.target.value,
              )
            }
          />

          <button
            type="submit"
            disabled={
              !content.trim() ||
              saving
            }
          >
            {saving
              ? "저장 중"
              : existingAnswer
                ? "답변 수정"
                : "답변 등록"}
          </button>
        </form>
      ) : (
        <div className="question-panel__voice">
          <button
            type="button"
            className="question-panel__record-stop"
            aria-label="음성 녹음 정지"
            disabled={!voiceEnabled}
            onClick={onVoiceStop}
          >
            <RecordStopIcon />
          </button>

          <div
            className="question-panel__waveform"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
    </div>
  );
}

function StudentAnswer({
  question,
}) {
  const answer =
    question?.answers?.[0];

  return (
    <div className="question-panel__answer-readonly">
      <strong>
        답변
      </strong>

      {answer ? (
        <p>
          {answer.content}
        </p>
      ) : (
        <p>
          아직 등록된 답변이 없습니다.
        </p>
      )}
    </div>
  );
}

export default function QuestionPanel({
  role,
  open,
  createMode,
  questions,
  selectedQuestion,
  loading,
  onClose,
  onSelectQuestion,
  onCheckSimilar,
  onCreateQuestion,
  onSubmitAnswer,
  onVoiceStop,
}) {
  const selectedQuestionId =
    selectedQuestion?.id ?? "";

  const categories =
    useMemo(
      () =>
        selectedQuestion
          ?.categories ?? [],
      [selectedQuestion],
    );

  if (!open) {
    return null;
  }

  return (
    <aside className="question-panel">
      <div className="question-panel__header">
        <h2>
          {createMode
            ? "질문 등록"
            : "질문 리스트"}
        </h2>

        <button
          type="button"
          aria-label="질문 패널 닫기"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>

      {loading ? (
        <div className="question-panel__empty">
          불러오는 중...
        </div>
      ) : createMode &&
        role === "STUDENT" ? (
        <StudentQuestionComposer
          onCheckSimilar={
            onCheckSimilar
          }
          onSubmit={
            onCreateQuestion
          }
        />
      ) : (
        <>
          <QuestionList
            questions={questions}
            selectedQuestionId={
              selectedQuestionId
            }
            onSelectQuestion={
              onSelectQuestion
            }
          />

          {selectedQuestion && (
            <section className="question-panel__detail">
              <h3>
                {
                  selectedQuestion.title
                }
              </h3>

              <p>
                {
                  selectedQuestion.content
                }
              </p>

              {categories.length >
                0 && (
                <div className="question-panel__categories">
                  {categories.map(
                    (category) => {
                      const id =
                        category.category_id ??
                        category.categoryId ??
                        category.id;

                      return (
                        <span
                          key={id}
                        >
                          {
                            category.name
                          }
                        </span>
                      );
                    },
                  )}
                </div>
              )}

              {role ===
              "PROFESSOR" ? (
                <ProfessorAnswerEditor
                  key={
                    selectedQuestion.id
                  }
                  question={
                    selectedQuestion
                  }
                  onSubmitAnswer={
                    onSubmitAnswer
                  }
                  onVoiceStop={
                    onVoiceStop
                  }
                />
              ) : (
                <StudentAnswer
                  question={
                    selectedQuestion
                  }
                />
              )}
            </section>
          )}
        </>
      )}
    </aside>
  );
}