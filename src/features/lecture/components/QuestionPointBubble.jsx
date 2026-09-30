import "../styles/question-point.css";

export default function QuestionPointBubble({
  question,
  side = "right",
  maxPanelHeight = 160,
  onOpen,
}) {
  if (
    !question ||
    question.xRatio == null ||
    question.yRatio == null
  ) {
    return null;
  }

  const status =
    String(
      question.status ||
        "PENDING",
    ).toLowerCase();

  const content =
    question.content ??
    question.refinedContent ??
    question.title ??
    "";

  return (
    <div
      className={`question-point-overlay question-point-overlay--${side} question-point-bubble`}
      style={{
        left:
          `${
            question.xRatio *
            100
          }%`,

        top:
          `${
            question.yRatio *
            100
          }%`,

        "--question-point-max-height":
          `${Math.max(
            35,
            maxPanelHeight,
          )}px`,
      }}
    >
      <button
        type="button"
        className={`question-point-overlay__marker question-point-overlay__marker--${status}`}
        aria-label={
          question.title ||
          content ||
          "질문"
        }
        onClick={() =>
          onOpen?.(
            question,
          )
        }
      >
        ?
      </button>

      <button
        type="button"
        className="question-point-overlay__panel question-point-bubble__content"
        onClick={() =>
          onOpen?.(
            question,
          )
        }
      >
        {content}
      </button>
    </div>
  );
}