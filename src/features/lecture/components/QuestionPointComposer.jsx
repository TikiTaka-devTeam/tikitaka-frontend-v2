import "../styles/question-point-composer.css";

const MARKER_SIZE = 35;
const BUBBLE_WIDTH = 250;
const BUBBLE_GAP = 10;

function getPoint(question) {
  return {
    x:
      question?.xRatio ??
      question?.x_ratio ??
      0,
    y:
      question?.yRatio ??
      question?.y_ratio ??
      0,
  };
}

function getQuestionTitle(question) {
  return (
    question?.title ||
    question?.content ||
    ""
  );
}

function getBubbleSide(
  point,
  pageWidth,
) {
  const width =
    Number(pageWidth);

  if (
    !width ||
    !Number.isFinite(width)
  ) {
    return "right";
  }

  const markerCenterX =
    point.x * width;

  const rightRequired =
    MARKER_SIZE / 2 +
    BUBBLE_GAP +
    BUBBLE_WIDTH;

  const hasRightSpace =
    markerCenterX +
      rightRequired <=
    width;

  return hasRightSpace
    ? "right"
    : "left";
}

function getBubbleStyle(side) {
  const markerOffset =
    MARKER_SIZE / 2 +
    BUBBLE_GAP;

  if (side === "left") {
    return {
      right: `${markerOffset}px`,
      left: "auto",
    };
  }

  return {
    left: `${markerOffset}px`,
    right: "auto",
  };
}

function QuestionMarker({
  draft = false,
  onClick,
}) {
  if (draft) {
    return (
      <span
        className="question-point__marker question-point__marker--draft"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      className="question-point__marker"
      aria-label="질문 보기"
      onClick={onClick}
    />
  );
}

export function QuestionPointBubble({
  question,
  pageWidth,
  expanded = false,
  showContent = false,
  onSelect,
  onClick,
}) {
  const point =
    getPoint(question);

  const title =
    getQuestionTitle(question);

  const showBubble =
    expanded ||
    showContent;

  const bubbleSide =
    getBubbleSide(
      point,
      pageWidth,
    );

  function handleClick(event) {
    event.stopPropagation();

    if (onSelect) {
      onSelect(question);
      return;
    }

    onClick?.(question);
  }

  return (
    <div
      className="question-point"
      style={{
        left: `${point.x * 100}%`,
        top: `${point.y * 100}%`,
      }}
    >
      {showBubble &&
        title && (
          <button
            type="button"
            className={`question-point__bubble question-point__bubble--${bubbleSide}`}
            style={
              getBubbleStyle(
                bubbleSide,
              )
            }
            onClick={
              handleClick
            }
          >
            {title}
          </button>
        )}

      <QuestionMarker
        onClick={
          handleClick
        }
      />
    </div>
  );
}

export default function QuestionPointComposer({
  point,
  pageWidth,
  title = "",
}) {
  if (!point) {
    return null;
  }

  const visibleTitle =
    String(
      title || "",
    ).trim();

  const bubbleSide =
    getBubbleSide(
      point,
      pageWidth,
    );

  return (
    <div
      className="question-point"
      style={{
        left: `${point.x * 100}%`,
        top: `${point.y * 100}%`,
      }}
    >
      {visibleTitle && (
        <span
          className={`question-point__bubble question-point__bubble--draft question-point__bubble--${bubbleSide}`}
          style={
            getBubbleStyle(
              bubbleSide,
            )
          }
        >
          {visibleTitle}
        </span>
      )}

      <QuestionMarker
        draft
      />
    </div>
  );
}