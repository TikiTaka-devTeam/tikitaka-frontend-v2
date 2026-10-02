import FixerComposer, { FixerBubble } from "./FixerComposer";

import QuestionPointComposer, {
  QuestionPointBubble,
} from "./QuestionPointComposer";

export default function SlideMarkers({
  role,

  activeTool,

  pageWidth,

  questions = [],

  selectedQuestionId,

  questionPoint,

  questionDraftTitle = "",

  createQuestionMode,

  questionSubmitting,

  onQuestionCancel,

  onQuestionSubmit,

  onQuestionSelect,

  fixers = [],

  onFixerSelect,

  fixerDraftPoint,

  onFixerDraftCancel,

  onFixerDraftSubmit,
}) {
  return (
    <div
      className="pdf-stage__markers"
      aria-label="질문 및 수정 메모 위치"
    >
      {activeTool === "Q_LIST" &&
        questions
          .filter(
            (
              question,
            ) =>
              question.xRatio !=
                null &&
              question.yRatio !=
                null &&
              selectedQuestionId != null &&
              String(question.id) === String(selectedQuestionId),
          )
          .map(
            (
              question,
            ) => (
              <QuestionPointBubble
                key={
                  question.id
                }
                question={
                  question
                }
                pageWidth={
                  pageWidth
                }
                showContent={
                  String(
                    question.id,
                  ) ===
                  String(
                    selectedQuestionId,
                  )
                }
                onClick={
                  onQuestionSelect
                }
              />
            ),
          )}

      {activeTool ===
        "Q_POINT" &&
        createQuestionMode &&
        questionPoint && (
          <QuestionPointComposer
            point={
              questionPoint
            }
            pageWidth={
              pageWidth
            }
            title={
              questionDraftTitle
            }
            role={
              role
            }
            submitting={
              questionSubmitting
            }
            onCancel={
              onQuestionCancel
            }
            onSubmit={
              onQuestionSubmit
            }
          />
        )}

      {activeTool === "FIXER" && fixers.filter((fixer) => !fixer.isChecked).map((fixer) => (
        <FixerBubble key={fixer.id} fixer={fixer} pageWidth={pageWidth} onCheck={onFixerSelect} />
      ))}

      <FixerComposer
        key={fixerDraftPoint ? `${fixerDraftPoint.x}:${fixerDraftPoint.y}` : "empty"}
        pageWidth={pageWidth}
        point={
          fixerDraftPoint
        }
        onCancel={
          onFixerDraftCancel
        }
        onSubmit={
          onFixerDraftSubmit
        }
      />
    </div>
  );
}
