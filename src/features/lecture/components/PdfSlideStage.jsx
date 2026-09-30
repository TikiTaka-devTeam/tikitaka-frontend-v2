import DrawingCursor from "./DrawingCursor";
import SlideMarkers from "./SlideMarkers";
import { useState } from "react";
import CheckCircleIcon from "../../../assets/icons/check-circle.svg";
import "../styles/slide-change-notice.css";

import useDrawingInteraction from "../hooks/useDrawingInteraction";
import usePdfPageRender from "../hooks/usePdfPageRender";

export default function PdfSlideStage({
  role,

  pdfUrl,

  pageNumber,
  deletedPageNotice,

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
  const [noticeDismissed, setNoticeDismissed] = useState(false);
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
      activeTool,

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
            className="pdf-stage__page"
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

            {deletedPageNotice && !noticeDismissed && (
              <div className="slide-change-notice">
                <span>※ 이 페이지는 삭제된 페이지 입니다.</span>
                <strong>({deletedPageNotice.index} / {deletedPageNotice.total})</strong>
                <button type="button" aria-label="삭제된 페이지 안내 닫기" onClick={() => setNoticeDismissed(true)}><img src={CheckCircleIcon} alt="" /></button>
              </div>
            )}
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
                createQuestionMode
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
                fixerDraftPoint
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
      </div>
    </section>
  );
}
