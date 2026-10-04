import DrawingCursor from "./DrawingCursor";
import { useSpaceAccess } from "../../spaces/context/SpaceAccessContext.js";
import SlideMarkers from "./SlideMarkers";
import CheckCircleIcon from "../../../assets/icons/check-circle.svg";
import "../styles/slide-change-notice.css";

import useDrawingInteraction from "../hooks/useDrawingInteraction";
import usePdfPageRender from "../hooks/usePdfPageRender";

export default function PdfSlideStage({
  role,

  pageTransitionDirection,

  pdfUrl,

  pageNumber,
  pageChangeNotice,
  onAcknowledgePageChange,

  zoom,

  activeTool,

  thickness,

  color,

  privateStrokes = [],

  sharedStrokes = [],

  liveStrokes = [],

  onLiveStroke,

  questions = [],

  selectedQuestionId,

  questionPoint,

  questionDraftTitle = "",

  createQuestionMode,

  questionSubmitting,

  fixers = [],

  editableLayer,

  onZoomChange,

  onPageMetrics,

  onPreviousPage,

  onNextPage,

  onCreateStroke,

  onEraseStrokes,

  onQuestionPoint,

  onQuestionCancel,

  onQuestionSubmit,

  onFixerPoint,

  onQuestionSelect,

  onFixerSelect,

  fixerDraftPoint,

  onFixerDraftCancel,

  onFixerDraftSubmit,
}) {
  const { readOnly } = useSpaceAccess();
  const {
    containerRef,

    pdfCanvasRef,

    pageSize,

    normalizedPdfUrl,

    visibleErrorMessage,
  } =
    usePdfPageRender({
      pdfUrl,

      pageNumber,

      zoom,

      onPageMetrics,
    });

  const {
    viewportRef,

    strokeCanvasRef,

    draftCanvasRef,
    liveCanvasRef,

    drawingCursorRef,

    strokeCanvasStyle,

    handlePointerDown,

    handlePointerMove,

    handlePointerEnter,

    handlePointerLeave,

    finishPointer,

    cancelPointer,
  } =
    useDrawingInteraction({
      activeTool: readOnly ? null : activeTool,

      thickness,

      color,

      pageSize,

      privateStrokes,

      sharedStrokes,

      liveStrokes,

      editableLayer,

      zoom,

      onZoomChange,

      onPreviousPage,

      onNextPage,

      onLiveStroke,

      onCreateStroke,

      onEraseStrokes,

      onQuestionPoint,

      onFixerPoint,
    });

  return (
    <section
      ref={
        containerRef
      }
      className="pdf-stage"
      onDragStart={(event) => event.preventDefault()}
    >
      <div
        ref={
          viewportRef
        }
        className="pdf-stage__viewport"
      >
        {!normalizedPdfUrl &&
          !visibleErrorMessage && (
            <div className="pdf-stage__message">
              강의자료를 불러오는 중입니다.
            </div>
          )}

        {visibleErrorMessage && (
          <div className="pdf-stage__message pdf-stage__message--error">
            {visibleErrorMessage}
          </div>
        )}

        {normalizedPdfUrl && (
          <div
            className={
              `pdf-stage__page${
                pageTransitionDirection
                  ? ` pdf-stage__page--enter-${pageTransitionDirection}`
                  : ""
              }`
            }
            style={{
              width:
                pageSize.width ||
                undefined,

              height:
                pageSize.height ||
                undefined,
            }}
          >
            <canvas
              ref={
                pdfCanvasRef
              }
              className="pdf-stage__pdf-canvas"
              draggable={false}
              aria-label="강의자료 PDF"
            />

            <canvas
              ref={
                strokeCanvasRef
              }
              className={`pdf-stage__stroke-canvas${
                activeTool ===
                "Q_POINT"
                  ? " is-question-point"
                  : ""
              }`}
              style={
                strokeCanvasStyle
              }
              draggable={false}
              aria-label="필기 영역"
              onPointerDown={
                handlePointerDown
              }
              onPointerMove={
                handlePointerMove
              }
              onPointerEnter={
                handlePointerEnter
              }
              onPointerLeave={
                handlePointerLeave
              }
              onPointerUp={
                finishPointer
              }
              onPointerCancel={
                cancelPointer
              }
              onLostPointerCapture={
                cancelPointer
              }
            />

            <canvas
              ref={liveCanvasRef}
              className="pdf-stage__stroke-canvas"
              aria-hidden="true"
              style={{ pointerEvents: "none" }}
            />

            <canvas
              ref={
                draftCanvasRef
              }
              className="pdf-stage__stroke-canvas"
              aria-hidden="true"
              style={{
                pointerEvents:
                  "none",
              }}
            />

            <DrawingCursor
              ref={
                drawingCursorRef
              }
            />

            <SlideMarkers
              role={
                role
              }
              activeTool={
                activeTool
              }
              pageWidth={
                pageSize.width
              }
              questions={
                questions
              }
              selectedQuestionId={
                selectedQuestionId
              }
              questionPoint={
                questionPoint
              }
              questionDraftTitle={
                questionDraftTitle
              }
              createQuestionMode={
                !readOnly && createQuestionMode
              }
              questionSubmitting={
                questionSubmitting
              }
              onQuestionCancel={
                onQuestionCancel
              }
              onQuestionSubmit={
                onQuestionSubmit
              }
              onQuestionSelect={
                onQuestionSelect
              }
              fixers={
                fixers
              }
              onFixerSelect={
                onFixerSelect
              }
              fixerDraftPoint={
                readOnly ? null : fixerDraftPoint
              }
              onFixerDraftCancel={
                onFixerDraftCancel
              }
              onFixerDraftSubmit={
                onFixerDraftSubmit
              }
            />
          </div>
        )}
        {pageChangeNotice && (
          <div className="slide-change-notice" role="status">
            <span>※ 이 페이지는 {pageChangeNotice.kind === "DELETED" ? "삭제된" : "수정된"} 페이지 입니다.</span>
            <strong>({pageChangeNotice.index} / {pageChangeNotice.total})</strong>
            <button type="button" aria-label="현재 변경 확인 및 다음 변경으로 이동" onClick={onAcknowledgePageChange}><img src={CheckCircleIcon} alt="" /></button>
          </div>
        )}
      </div>
    </section>
  );
}
