import {
  useEffect,
  useRef,
  useState,
} from "react";

import ProfessorQuestionPanel from "./ProfessorQuestionPanel";

import "../styles/question-panel.css";

const QUESTION_NOTIFICATION_EVENT =
  "tikitaka:question-notification";

function emitQuestionNotification(
  hasNotification,
) {
  window.dispatchEvent(
    new CustomEvent(
      QUESTION_NOTIFICATION_EVENT,
      {
        detail: {
          hasNotification,
        },
      },
    ),
  );
}

function getQuestionTitle(
  question,
) {
  return (
    question?.title ||
    question?.content ||
    "질문"
  );
}

function getQuestionId(
  question,
) {
  const id =
    question?.id ??
    question?.question_id ??
    question?.questionId;

  return id == null
    ? ""
    : String(id);
}

function isAnswered(
  question,
) {
  const status =
    String(
      question?.status ||
        "",
    ).toUpperCase();

  if (
    status === "ANSWERED" ||
    status === "RESOLVED" ||
    status === "COMPLETED"
  ) {
    return true;
  }

  return Boolean(
    question?.answers
      ?.length,
  );
}

function StudentQuestionComposer({
  submitting,
  onSubmit,
}) {
  const [
    title,
    setTitle,
  ] = useState("");

  const [
    content,
    setContent,
  ] = useState("");

  const canSubmit =
    Boolean(
      title.trim(),
    ) &&
    Boolean(
      content.trim(),
    ) &&
    !submitting;

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    await onSubmit?.({
      title:
        title.trim(),

      content:
        content.trim(),
    });
  }

  return (
    <form
      className="question-panel__composer"
      onSubmit={
        handleSubmit
      }
    >
      <label>
        <span>
          질문 제목
        </span>

        <input
          value={title}
          maxLength={120}
          placeholder="질문 제목을 입력해주세요"
          onChange={(
            event,
          ) =>
            setTitle(
              event
                .target
                .value,
            )
          }
        />
      </label>

      <label>
        <span>
          질문 내용
        </span>

        <textarea
          value={content}
          placeholder="질문 내용을 입력해주세요"
          onChange={(
            event,
          ) =>
            setContent(
              event
                .target
                .value,
            )
          }
        />
      </label>

      {title.trim() &&
        content.trim() && (
          <p className="question-panel__warning">
            ※ 등록한 질문은 이후 수정/삭제 할 수 없습니다
          </p>
        )}

      <div className="question-panel__composer-actions">
        <button
          type="submit"
          className="question-panel__submit"
          disabled={
            !canSubmit
          }
        >
          {submitting
            ? "등록 중"
            : "질문하기"}
        </button>
      </div>
    </form>
  );
}

function QuestionList({
  questions,
  selectedQuestionId,
  onSelectQuestion,
}) {
  const scrollRef =
    useRef(null);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  const [
    atBottom,
    setAtBottom,
  ] = useState(
    !hasOverflow,
  );

  const questionIdsKey =
    questions
      .map(
        getQuestionId,
      )
      .join("|");

  function updateScrollState() {
    const element =
      scrollRef.current;

    if (
      !element
    ) {
      setAtBottom(
        true,
      );

      return;
    }

    const reachedBottom =
      element.scrollTop +
        element.clientHeight >=
      element.scrollHeight -
        2;

    const remaining = element.scrollHeight - element.clientHeight - element.scrollTop;

    setHasOverflow(element.scrollHeight > element.clientHeight + 2);
    setFadeOpacity(Math.min(1, Math.max(0, remaining / 64)));

    setAtBottom(
      reachedBottom,
    );
  }

  useEffect(() => {
    const element =
      scrollRef.current;

    if (element) {
      element.scrollTop =
        0;
    }

    let frame;
    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!element) return;
        setHasOverflow(element.scrollHeight > element.clientHeight + 2);
        const remaining = element.scrollHeight - element.clientHeight - element.scrollTop;
        setAtBottom(remaining <= 2);
        setFadeOpacity(Math.min(1, Math.max(0, remaining / 64)));
      });
    };
    const observer = new ResizeObserver(measure);
    if (element) observer.observe(element);
    measure();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(
        frame,
      );
    };
  }, [
    questionIdsKey,
  ]);

  if (
    !questions.length
  ) {
    return (
      <div className="question-panel__empty">
        등록된 질문이 없습니다.
      </div>
    );
  }

  const viewportClass =
    `question-panel__list-viewport${
      hasOverflow
        ? " is-overflowing"
        : ""
    }${
      atBottom
        ? " is-at-bottom"
        : ""
    }`;

  return (
    <div
      className={
        viewportClass
      }
    >
      <div
        ref={
          scrollRef
        }
        className="question-panel__list-scroll"
        onScroll={
          updateScrollState
        }
      >
        <div className="question-panel__list">
          {questions.map(
            (
              question,
            ) => {
              const answered =
                isAnswered(
                  question,
                );

              const selected =
                String(
                  question.id,
                ) ===
                String(
                  selectedQuestionId,
                );

              return (
                <button
                  type="button"
                  key={
                    question.id
                  }
                  className={
                    selected
                      ? "is-selected"
                      : ""
                  }
                  onClick={() =>
                    onSelectQuestion?.(
                      question,
                    )
                  }
                >
                  <span
                    className={`question-panel__status${
                      answered
                        ? " question-panel__status--answered"
                        : ""
                    }`}
                    aria-hidden="true"
                  />

                  <span className="question-panel__list-text">
                    <strong>
                      {getQuestionTitle(
                        question,
                      )}
                    </strong>

                    <small>
                      {question.categories?.map((category) => category.name ?? category.category_name).filter(Boolean).join(", ") && (
                        <>{question.categories.map((category) => category.name ?? category.category_name).filter(Boolean).join(", ")} · </>
                      )}
                      {answered
                        ? "답변 완료"
                        : "미답변"}
                    </small>
                  </span>
                </button>
              );
            },
          )}
        </div>
      </div>

      {selectedQuestionId && hasOverflow && (
        <div
          className="question-panel__list-fade"
          aria-hidden="true"
          style={{ opacity: fadeOpacity }}
        />
      )}
    </div>
  );
}

function SimilarQuestionList({
  questions,
}) {
  if (
    !questions.length
  ) {
    return null;
  }

  return (
    <div className="question-panel__similar">
      <strong>
        비슷한 질문이 있어요
      </strong>

      <div className="question-panel__similar-list">
        {questions.map(
          (
            question,
          ) => {
            const id =
              question
                .question_id ??
              question
                .questionId ??
              question.id;

            const likeCount =
              question
                .like_count ??
              question
                .likeCount ??
              0;

            return (
              <article
                key={id}
              >
                <h4>
                  {getQuestionTitle(
                    question,
                  )}
                </h4>

                {question
                  .content && (
                  <p>
                    {
                      question.content
                    }
                  </p>
                )}

                <span>
                  공감{" "}
                  {likeCount}
                </span>
              </article>
            );
          },
        )}
      </div>
    </div>
  );
}

function StudentAnswer({
  question,
}) {
  const answer =
    question?.answers
      ?.[0];

  return (
    <div className="question-panel__answer-readonly">
      {answer ? (
        <p>
          {answer.content}
        </p>
      ) : (
        <p className="question-panel__answer-empty">
          아직 답변이 등록되지 않았습니다.
        </p>
      )}
    </div>
  );
}

export default function QuestionPanel({
  role,
  open,
  createMode =
    false,
  submitting =
    false,
  questions = [],
  questionScope =
    "SLIDE",
  scopeLoading =
    false,
  selectedQuestion,
  loading,
  onSelectQuestion,
  onQuestionScopeChange,
  onCheckSimilar,
  similarQuestionState,
  onCreateQuestion,
  onSubmitAnswer,
  onSubmitVoice,
  onArchive,
}) {
  const normalizedRole =
    String(
      role ||
        "STUDENT",
    ).toUpperCase();

  const selectedQuestionId =
    selectedQuestion
      ?.id ??
    "";

  const knownQuestionIdsRef =
    useRef(null);

  useEffect(() => {
    if (
      loading ||
      scopeLoading
    ) {
      return;
    }

    const nextQuestionIds =
      new Set(
        questions
          .map(
            getQuestionId,
          )
          .filter(
            Boolean,
          ),
      );

    if (
      knownQuestionIdsRef
        .current === null
    ) {
      knownQuestionIdsRef.current =
        nextQuestionIds;

      return;
    }

    const previousQuestionIds =
      knownQuestionIdsRef.current;

    const previousQuestionsRemain =
      [...previousQuestionIds]
        .every(
          (id) =>
            nextQuestionIds
              .has(id),
        );

    const hasNewQuestion =
      nextQuestionIds.size >
        previousQuestionIds.size &&
      previousQuestionsRemain &&
      [...nextQuestionIds]
        .some(
          (id) =>
            !previousQuestionIds
              .has(id),
        );

    knownQuestionIdsRef.current =
      nextQuestionIds;

    if (
      hasNewQuestion &&
      !open
    ) {
      emitQuestionNotification(
        true,
      );
    }
  }, [
    loading,
    open,
    questions,
    scopeLoading,
  ]);

  useEffect(() => {
    if (open) {
      emitQuestionNotification(
        false,
      );
    }
  }, [
    open,
  ]);

  if (!open) {
    return null;
  }

  if (
    createMode &&
    normalizedRole ===
      "STUDENT"
  ) {
    return (
      <aside className="question-panel question-panel--create">
        <div className="question-panel__header">
          <div className="question-panel__header-copy">
            <h2>
              질문하기
            </h2>

            <p>
              궁금한 점을 물어보세요
            </p>
          </div>
        </div>

        <StudentQuestionComposer
          submitting={
            submitting
          }
          onSubmit={
            onCreateQuestion
          }
        />
      </aside>
    );
  }

  if (normalizedRole === "PROFESSOR") {
    return <ProfessorQuestionPanel
      onArchive={onArchive}
      selectedQuestion={selectedQuestion}
      questions={questions}
      questionScope={questionScope}
      loading={loading || scopeLoading}
      onQuestionScopeChange={onQuestionScopeChange}
      onSubmitAnswer={onSubmitAnswer}
      onSubmitVoice={onSubmitVoice}
      renderList={(items) => <QuestionList questions={items} selectedQuestionId={selectedQuestionId} onSelectQuestion={onSelectQuestion} />}
    />;
  }

  const panelLoading =
    loading ||
    scopeLoading;

  const scopeSubtitle =
    questionScope ===
    "DOCUMENT"
      ? "전체"
      : "해당 페이지";

  return (
    <aside className={`question-panel question-panel--list question-panel--student-list${selectedQuestion ? " is-question-selected" : ""}`}>
      <div className="question-panel__header">
        <div className="question-panel__header-copy">
          <h2>
            질문 리스트
          </h2>

          <p>
            {scopeSubtitle}
          </p>
        </div>

        <div className="question-panel__header-actions">
          <button
            type="button"
            className="question-panel__archive"
            onClick={
              onArchive
            }
          >
            질문 아카이브
          </button>
        </div>
      </div>

      <div className="question-panel__scope-row">
        <button
          type="button"
          className={`question-panel__scope-button${
            questionScope ===
            "SLIDE"
              ? " is-active"
              : ""
          }`}
          onClick={() =>
            onQuestionScopeChange?.(
              "SLIDE",
            )
          }
        >
          해당페이지
        </button>

        <button
          type="button"
          className={`question-panel__scope-button${
            questionScope ===
            "DOCUMENT"
              ? " is-active"
              : ""
          }`}
          onClick={() =>
            onQuestionScopeChange?.(
              "DOCUMENT",
            )
          }
        >
          전체
        </button>
      </div>

      <div className="question-panel__scroll">
        {panelLoading ? (
          <div className="question-panel__empty">
            불러오는 중...
          </div>
        ) : (
          <QuestionList
            questions={
              questions
            }
            selectedQuestionId={
              selectedQuestionId
            }
            onSelectQuestion={
              onSelectQuestion
            }
          />
        )}

        {selectedQuestion && <>
        <div className="question-panel__divider" />

        <section className="question-panel__answer-section">
          <h3 className="question-panel__answer-heading">
            답변
          </h3>

          {!selectedQuestion ? (
            <p className="question-panel__answer-empty">
              아직 답변이 등록되지 않았습니다.
            </p>
          ) : (
            <>
              {onCheckSimilar && (
                <div className="question-panel__detail-question">
                  {normalizedRole ===
                    "STUDENT" &&
                    onCheckSimilar && (
                      <button
                        type="button"
                        className="question-panel__similar-trigger"
                        disabled={
                          similarQuestionState
                            ?.questionId ===
                            selectedQuestion.id &&
                          similarQuestionState
                            ?.status ===
                            "loading"
                        }
                        onClick={() =>
                          onCheckSimilar(
                            selectedQuestion.id,
                          )
                        }
                      >
                        {similarQuestionState
                          ?.questionId ===
                            selectedQuestion.id &&
                        similarQuestionState
                          ?.status ===
                          "loading"
                          ? "AI 유사 질문 확인 중"
                          : "AI 유사 질문 확인"}
                      </button>
                    )}

                  {normalizedRole ===
                    "STUDENT" &&
                    similarQuestionState
                      ?.questionId ===
                      selectedQuestion.id &&
                    similarQuestionState
                      ?.status ===
                      "success" &&
                    similarQuestionState
                      ?.questions
                      ?.length >
                      0 && (
                      <SimilarQuestionList
                        questions={
                          similarQuestionState.questions
                        }
                      />
                    )}
                </div>
              )}

              <StudentAnswer question={selectedQuestion} />
            </>
          )}
        </section>
        </>}
      </div>
    </aside>
  );
}
