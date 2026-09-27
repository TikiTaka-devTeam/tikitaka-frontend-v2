import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import FixerComposer from "./FixerComposer";

GlobalWorkerOptions.workerSrc = pdfWorker;

const DRAW_TOOLS = new Set([
  "PEN",
  "HIGHLIGHTER",
]);

const MIN_DRAW_POINT_DISTANCE_PX = 0.75;
const FINAL_POINT_DISTANCE_PX = 0.05;

function clamp(value, min, max) {
  return Math.min(
    Math.max(value, min),
    max,
  );
}

function pointFromEvent(
  event,
  canvas,
) {
  const rect =
    canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return null;
  }

  return {
    x: clamp(
      (event.clientX - rect.left) /
        rect.width,
      0,
      1,
    ),
    y: clamp(
      (event.clientY - rect.top) /
        rect.height,
      0,
      1,
    ),
  };
}

function getPointerSamples(event) {
  const nativeEvent =
    event.nativeEvent ?? event;

  if (
    typeof nativeEvent.getCoalescedEvents ===
    "function"
  ) {
    const coalescedEvents =
      nativeEvent.getCoalescedEvents();

    if (coalescedEvents.length) {
      return [
        ...coalescedEvents,
        nativeEvent,
      ];
    }
  }

  return [nativeEvent];
}

function pointDistanceInPixels(
  first,
  second,
  width,
  height,
) {
  return Math.hypot(
    (second.x - first.x) * width,
    (second.y - first.y) * height,
  );
}

function drawStroke(
  context,
  stroke,
  width,
  height,
) {
  const points = stroke.points ?? [];

  if (!points.length) {
    return;
  }

  const baseSize = Math.min(
    width,
    height,
  );

  const lineWidth = Math.max(
    0.5,
    Number(
      stroke.thickness || 0.0045,
    ) * baseSize,
  );

  context.save();

  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = lineWidth;

  context.strokeStyle =
    stroke.color || "#212326";

  context.fillStyle =
    stroke.color || "#212326";

  context.globalAlpha = Number(
    stroke.opacity ??
      (stroke.tool === "HIGHLIGHTER"
        ? 0.4
        : 1),
  );

  if (points.length === 1) {
    context.beginPath();

    context.arc(
      points[0].x * width,
      points[0].y * height,
      lineWidth / 2,
      0,
      Math.PI * 2,
    );

    context.fill();
    context.restore();

    return;
  }

  context.beginPath();

  context.moveTo(
    points[0].x * width,
    points[0].y * height,
  );

  if (points.length === 2) {
    context.lineTo(
      points[1].x * width,
      points[1].y * height,
    );
  } else {
    for (
      let index = 1;
      index < points.length - 1;
      index += 1
    ) {
      const current =
        points[index];

      const next =
        points[index + 1];

      const midpointX =
        (current.x + next.x) / 2;

      const midpointY =
        (current.y + next.y) / 2;

      context.quadraticCurveTo(
        current.x * width,
        current.y * height,
        midpointX * width,
        midpointY * height,
      );
    }

    const lastPoint =
      points[points.length - 1];

    context.quadraticCurveTo(
      lastPoint.x * width,
      lastPoint.y * height,
      lastPoint.x * width,
      lastPoint.y * height,
    );
  }

  context.stroke();
  context.restore();
}

function redrawStrokeCanvas(
  canvas,
  strokes,
  width,
  height,
) {
  if (
    !canvas ||
    !width ||
    !height
  ) {
    return;
  }

  const pixelRatio =
    window.devicePixelRatio || 1;

  const canvasWidth =
    Math.round(
      width * pixelRatio,
    );

  const canvasHeight =
    Math.round(
      height * pixelRatio,
    );

  if (
    canvas.width !== canvasWidth
  ) {
    canvas.width = canvasWidth;
  }

  if (
    canvas.height !== canvasHeight
  ) {
    canvas.height = canvasHeight;
  }

  const cssWidth = `${width}px`;
  const cssHeight = `${height}px`;

  if (
    canvas.style.width !== cssWidth
  ) {
    canvas.style.width = cssWidth;
  }

  if (
    canvas.style.height !== cssHeight
  ) {
    canvas.style.height = cssHeight;
  }

  const context =
    canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.setTransform(
    pixelRatio,
    0,
    0,
    pixelRatio,
    0,
    0,
  );

  context.clearRect(
    0,
    0,
    width,
    height,
  );

  strokes.forEach((stroke) => {
    drawStroke(
      context,
      stroke,
      width,
      height,
    );
  });
}

function distanceToSegment(
  px,
  py,
  x1,
  y1,
  x2,
  y2,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.hypot(
      px - x1,
      py - y1,
    );
  }

  const t = clamp(
    (
      (px - x1) * dx +
      (py - y1) * dy
    ) /
      (
        dx * dx +
        dy * dy
      ),
    0,
    1,
  );

  const closestX =
    x1 + t * dx;

  const closestY =
    y1 + t * dy;

  return Math.hypot(
    px - closestX,
    py - closestY,
  );
}

function findErasableStrokeIds(
  strokes,
  point,
  width,
  height,
  thickness,
) {
  const baseSize = Math.min(
    width,
    height,
  );

  const radius = Math.max(
    6,
    thickness *
      baseSize *
      0.65,
  );

  const pointerX =
    point.x * width;

  const pointerY =
    point.y * height;

  return strokes
    .filter((stroke) => {
      const points =
        stroke.points ?? [];

      if (!points.length) {
        return false;
      }

      if (points.length === 1) {
        return (
          Math.hypot(
            pointerX -
              points[0].x * width,
            pointerY -
              points[0].y * height,
          ) <= radius
        );
      }

      for (
        let index = 1;
        index < points.length;
        index += 1
      ) {
        const previous =
          points[index - 1];

        const current =
          points[index];

        const distance =
          distanceToSegment(
            pointerX,
            pointerY,
            previous.x * width,
            previous.y * height,
            current.x * width,
            current.y * height,
          );

        if (distance <= radius) {
          return true;
        }
      }

      return false;
    })
    .map((stroke) => stroke.id)
    .filter(Boolean);
}

function getTouchDistance(
  pointerMap,
) {
  const pointers =
    Array.from(
      pointerMap.values(),
    );

  if (pointers.length < 2) {
    return 0;
  }

  return Math.hypot(
    pointers[0].x -
      pointers[1].x,
    pointers[0].y -
      pointers[1].y,
  );
}

export default function PdfSlideStage({
  pdfUrl,
  pageNumber,
  zoom,
  activeTool,
  thickness,
  color,
  privateStrokes = [],
  sharedStrokes = [],
  questions = [],
  fixers = [],
  editableLayer,
  onZoomChange,
  onCreateStroke,
  onEraseStrokes,
  onQuestionPoint,
  onFixerPoint,
  onQuestionSelect,
  onFixerSelect,
  fixerDraftPoint,
  onFixerDraftCancel,
  onFixerDraftSubmit,
}) {
  const viewportRef =
    useRef(null);

  const containerRef =
    useRef(null);

  const pdfCanvasRef =
    useRef(null);

  const strokeCanvasRef =
    useRef(null);

  const draftCanvasRef =
    useRef(null);

  const draftStrokeRef =
    useRef(null);

  const draftFrameRef =
    useRef(null);

  const activePointerRef =
    useRef(null);

  const erasedIdsRef =
    useRef(new Set());

  const touchesRef =
    useRef(new Map());

  const pinchRef =
    useRef(null);

  const [pdfDocument, setPdfDocument] =
    useState(null);

  const [
    pdfDocumentUrl,
    setPdfDocumentUrl,
  ] = useState("");

  const [
    viewportSize,
    setViewportSize,
  ] = useState({
    width: 0,
    height: 0,
  });

  const [
    pageSize,
    setPageSize,
  ] = useState({
    width: 0,
    height: 0,
  });

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const normalizedPdfUrl =
    typeof pdfUrl === "string"
      ? pdfUrl.trim()
      : "";

  const editableStrokes =
    editableLayer === "SHARED"
      ? sharedStrokes
      : privateStrokes;

  const visibleStrokes =
    useMemo(
      () =>
        [
          ...sharedStrokes,
          ...privateStrokes,
        ].filter(
          (stroke) =>
            !stroke.isDeleted,
        ),
      [
        privateStrokes,
        sharedStrokes,
      ],
    );

  useEffect(() => {
    if (!normalizedPdfUrl) {
      setPdfDocument(null);
      setPdfDocumentUrl("");

      if (pdfUrl) {
        setErrorMessage(
          "PDF 주소 형식이 올바르지 않습니다.",
        );
      }

      return undefined;
    }

    let cancelled = false;

    console.log(
      "[PdfSlideStage] pdfUrl:",
      typeof normalizedPdfUrl,
      normalizedPdfUrl,
    );

    const loadingTask =
      getDocument({
        url: normalizedPdfUrl,
      });

    loadingTask.promise
      .then((loadedDocument) => {
        if (cancelled) {
          loadedDocument.destroy();
          return;
        }

        setPdfDocument(
          loadedDocument,
        );

        setPdfDocumentUrl(
          normalizedPdfUrl,
        );

        setErrorMessage("");
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setPdfDocument(null);
        setPdfDocumentUrl("");

        setErrorMessage(
          error?.message ||
            "PDF를 불러오지 못했습니다.",
        );
      });

    return () => {
      cancelled = true;

      loadingTask.destroy();
    };
  }, [
    normalizedPdfUrl,
    pdfUrl,
  ]);

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) {
      return undefined;
    }

    const observer =
      new ResizeObserver(
        (entries) => {
          const entry =
            entries[0];

          if (!entry) {
            return;
          }

          setViewportSize({
            width:
              entry.contentRect.width,

            height:
              entry.contentRect.height,
          });
        },
      );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      !pdfDocument ||
      pdfDocumentUrl !==
        normalizedPdfUrl ||
      !viewportSize.width ||
      !viewportSize.height
    ) {
      return undefined;
    }

    let cancelled = false;
    let renderTask = null;

    const safePageNumber =
      clamp(
        Number(pageNumber) || 1,
        1,
        pdfDocument.numPages,
      );

    pdfDocument
      .getPage(
        safePageNumber,
      )
      .then((page) => {
        if (cancelled) {
          return null;
        }

        const baseViewport =
          page.getViewport({
            scale: 1,
          });

        const fitScale =
          Math.min(
            viewportSize.width /
              baseViewport.width,

            viewportSize.height /
              baseViewport.height,
          );

        const cssScale =
          Math.max(
            0.01,
            fitScale * zoom,
          );

        const cssViewport =
          page.getViewport({
            scale: cssScale,
          });

        const pixelRatio =
          window.devicePixelRatio ||
          1;

        const renderViewport =
          page.getViewport({
            scale:
              cssScale *
              pixelRatio,
          });

        const canvas =
          pdfCanvasRef.current;

        if (!canvas) {
          return null;
        }

        canvas.width =
          Math.round(
            renderViewport.width,
          );

        canvas.height =
          Math.round(
            renderViewport.height,
          );

        canvas.style.width =
          `${cssViewport.width}px`;

        canvas.style.height =
          `${cssViewport.height}px`;

        setPageSize({
          width:
            cssViewport.width,

          height:
            cssViewport.height,
        });

        const context =
          canvas.getContext("2d");

        if (!context) {
          return null;
        }

        renderTask =
          page.render({
            canvasContext:
              context,

            viewport:
              renderViewport,
          });

        return renderTask.promise;
      })
      .catch((error) => {
        if (
          !cancelled &&
          error?.name !==
            "RenderingCancelledException"
        ) {
          setErrorMessage(
            error?.message ||
              "PDF 페이지를 렌더링하지 못했습니다.",
          );
        }
      });

    return () => {
      cancelled = true;

      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [
    pageNumber,
    pdfDocument,
    pdfDocumentUrl,
    normalizedPdfUrl,
    viewportSize.height,
    viewportSize.width,
    zoom,
  ]);

  useEffect(() => {
    redrawStrokeCanvas(
      strokeCanvasRef.current,
      visibleStrokes,
      pageSize.width,
      pageSize.height,
    );
  }, [
    pageSize.height,
    pageSize.width,
    visibleStrokes,
  ]);

  useEffect(() => {
    redrawStrokeCanvas(
      draftCanvasRef.current,
      draftStrokeRef.current
        ? [draftStrokeRef.current]
        : [],
      pageSize.width,
      pageSize.height,
    );
  }, [
    pageSize.height,
    pageSize.width,
  ]);

  useEffect(
    () => () => {
      if (
        draftFrameRef.current != null
      ) {
        cancelAnimationFrame(
          draftFrameRef.current,
        );
      }
    },
    [],
  );

  function scheduleDraftRedraw() {
    if (
      draftFrameRef.current != null
    ) {
      return;
    }

    draftFrameRef.current =
      requestAnimationFrame(() => {
        draftFrameRef.current = null;

        redrawStrokeCanvas(
          draftCanvasRef.current,
          draftStrokeRef.current
            ? [draftStrokeRef.current]
            : [],
          pageSize.width,
          pageSize.height,
        );
      });
  }

  function clearDraftStroke() {
    if (
      draftFrameRef.current != null
    ) {
      cancelAnimationFrame(
        draftFrameRef.current,
      );

      draftFrameRef.current = null;
    }

    draftStrokeRef.current = null;

    redrawStrokeCanvas(
      draftCanvasRef.current,
      [],
      pageSize.width,
      pageSize.height,
    );
  }

  function appendPointerSamples(
    event,
    forceFinalPoint = false,
  ) {
    const canvas =
      strokeCanvasRef.current;

    const draftStroke =
      draftStrokeRef.current;

    if (
      !canvas ||
      !draftStroke ||
      !pageSize.width ||
      !pageSize.height
    ) {
      return;
    }

    const samples =
      getPointerSamples(event);

    let changed = false;

    samples.forEach(
      (sample, index) => {
        const point =
          pointFromEvent(
            sample,
            canvas,
          );

        if (!point) {
          return;
        }

        const lastPoint =
          draftStroke.points[
            draftStroke.points.length -
              1
          ];

        if (!lastPoint) {
          draftStroke.points.push(
            point,
          );

          changed = true;
          return;
        }

        const distance =
          pointDistanceInPixels(
            lastPoint,
            point,
            pageSize.width,
            pageSize.height,
          );

        const isLastSample =
          index ===
          samples.length - 1;

        const minimumDistance =
          forceFinalPoint &&
          isLastSample
            ? FINAL_POINT_DISTANCE_PX
            : MIN_DRAW_POINT_DISTANCE_PX;

        if (
          distance >=
          minimumDistance
        ) {
          draftStroke.points.push(
            point,
          );

          changed = true;
        }
      },
    );

    if (changed) {
      scheduleDraftRedraw();
    }
  }

  function handleTouchDown(
    event,
  ) {
    const viewport =
      viewportRef.current;

    if (!viewport) {
      return;
    }

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    touchesRef.current.set(
      event.pointerId,
      {
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
      },
    );

    if (
      touchesRef.current.size === 2
    ) {
      pinchRef.current = {
        startDistance:
          getTouchDistance(
            touchesRef.current,
          ),

        startZoom: zoom,
      };
    }
  }

  function handleTouchMove(
    event,
  ) {
    const viewport =
      viewportRef.current;

    const pointer =
      touchesRef.current.get(
        event.pointerId,
      );

    if (
      !viewport ||
      !pointer
    ) {
      return;
    }

    event.preventDefault();

    pointer.x =
      event.clientX;

    pointer.y =
      event.clientY;

    if (
      touchesRef.current.size === 1
    ) {
      viewport.scrollLeft -=
        event.clientX -
        pointer.lastX;

      viewport.scrollTop -=
        event.clientY -
        pointer.lastY;
    }

    if (
      touchesRef.current.size === 2 &&
      pinchRef.current
    ) {
      const currentDistance =
        getTouchDistance(
          touchesRef.current,
        );

      if (
        currentDistance &&
        pinchRef.current
          .startDistance
      ) {
        const nextZoom =
          pinchRef.current.startZoom *
          (
            currentDistance /
            pinchRef.current
              .startDistance
          );

        onZoomChange?.(
          clamp(
            nextZoom,
            0.75,
            3,
          ),
        );
      }
    }

    pointer.lastX =
      event.clientX;

    pointer.lastY =
      event.clientY;
  }

  function handleTouchEnd(
    event,
  ) {
    touchesRef.current.delete(
      event.pointerId,
    );

    if (
      touchesRef.current.size < 2
    ) {
      pinchRef.current = null;
    }
  }

  function handlePointerDown(
    event,
  ) {
    if (
      event.pointerType ===
      "touch"
    ) {
      handleTouchDown(event);
      return;
    }

    if (
      event.pointerType ===
        "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    const canvas =
      strokeCanvasRef.current;

    const point =
      canvas
        ? pointFromEvent(
            event,
            canvas,
          )
        : null;

    if (!point) {
      return;
    }

    if (
      activeTool ===
      "Q_POINT"
    ) {
      onQuestionPoint?.(
        point,
      );

      return;
    }

    if (
      activeTool ===
      "FIXER"
    ) {
      onFixerPoint?.(
        point,
      );

      return;
    }

    if (
      activeTool ===
      "ERASER"
    ) {
      const strokeIds =
        findErasableStrokeIds(
          editableStrokes,
          point,
          pageSize.width,
          pageSize.height,
          thickness,
        );

      erasedIdsRef.current =
        new Set(strokeIds);

      activePointerRef.current =
        event.pointerId;

      event.currentTarget.setPointerCapture(
        event.pointerId,
      );

      return;
    }

    if (
      !DRAW_TOOLS.has(
        activeTool,
      )
    ) {
      return;
    }

    const opacity =
      activeTool ===
      "HIGHLIGHTER"
        ? 0.4
        : 1;

    activePointerRef.current =
      event.pointerId;

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    draftStrokeRef.current = {
      id: `draft-${Date.now()}`,
      tool: activeTool,
      points: [point],
      color,
      thickness,
      opacity,
      strokeOrder:
        editableStrokes.length +
        1,
    };

    scheduleDraftRedraw();
  }

  function handlePointerMove(
    event,
  ) {
    if (
      event.pointerType ===
      "touch"
    ) {
      handleTouchMove(event);
      return;
    }

    if (
      activePointerRef.current !==
      event.pointerId
    ) {
      return;
    }

    const canvas =
      strokeCanvasRef.current;

    if (!canvas) {
      return;
    }

    if (
      activeTool ===
      "ERASER"
    ) {
      const point =
        pointFromEvent(
          event,
          canvas,
        );

      if (!point) {
        return;
      }

      const strokeIds =
        findErasableStrokeIds(
          editableStrokes,
          point,
          pageSize.width,
          pageSize.height,
          thickness,
        ).filter(
          (id) =>
            !erasedIdsRef.current.has(
              id,
            ),
        );

      strokeIds.forEach(
        (id) => {
          erasedIdsRef.current.add(
            id,
          );
        },
      );

      return;
    }

    appendPointerSamples(event);
  }

  function finishPointer(
    event,
  ) {
    if (
      event.pointerType ===
      "touch"
    ) {
      handleTouchEnd(event);
      return;
    }

    if (
      activePointerRef.current !==
      event.pointerId
    ) {
      return;
    }

    activePointerRef.current =
      null;

    if (
      activeTool ===
      "ERASER"
    ) {
      const erasedIds =
        Array.from(
          erasedIdsRef.current,
        );

      erasedIdsRef.current.clear();

      if (erasedIds.length) {
        onEraseStrokes?.(
          erasedIds,
        );
      }

      return;
    }

    erasedIdsRef.current.clear();

    appendPointerSamples(
      event,
      true,
    );

    const completedStroke =
      draftStrokeRef.current;

    if (completedStroke) {
      onCreateStroke?.(
        completedStroke,
      );
    }

    clearDraftStroke();
  }

  function cancelPointer(
    event,
  ) {
    if (
      event.pointerType ===
      "touch"
    ) {
      handleTouchEnd(event);
      return;
    }

    activePointerRef.current =
      null;

    erasedIdsRef.current.clear();

    clearDraftStroke();
  }

  return (
    <section
      ref={containerRef}
      className="pdf-stage"
    >
      <div
        ref={viewportRef}
        className="pdf-stage__viewport"
      >
        {!normalizedPdfUrl && (
          <div className="pdf-stage__message">
            강의자료를 불러오는 중입니다.
          </div>
        )}

        {errorMessage && (
          <div className="pdf-stage__message pdf-stage__message--error">
            {errorMessage}
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
              ref={pdfCanvasRef}
              className="pdf-stage__pdf-canvas"
              aria-label="강의자료 PDF"
            />

            <canvas
              ref={strokeCanvasRef}
              className="pdf-stage__stroke-canvas"
              aria-label="필기 영역"
              onPointerDown={
                handlePointerDown
              }
              onPointerMove={
                handlePointerMove
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
              ref={draftCanvasRef}
              className="pdf-stage__stroke-canvas"
              aria-hidden="true"
              style={{
                pointerEvents: "none",
              }}
            />

            <div
              className="pdf-stage__markers"
              aria-label="질문 및 수정 메모 위치"
            >
              {questions
                .filter(
                  (question) =>
                    question.xRatio !=
                      null &&
                    question.yRatio !=
                      null,
                )
                .map(
                  (question) => (
                    <button
                      type="button"
                      key={
                        question.id
                      }
                      className={`question-marker question-marker--${(
                        question.status ||
                        "PENDING"
                      ).toLowerCase()}`}
                      style={{
                        left: `${
                          question.xRatio *
                          100
                        }%`,

                        top: `${
                          question.yRatio *
                          100
                        }%`,
                      }}
                      aria-label={
                        question.title
                      }
                      onClick={() =>
                        onQuestionSelect?.(
                          question,
                        )
                      }
                    >
                      ?
                    </button>
                  ),
                )}

              {fixers.map(
                (fixer) => (
                  <button
                    type="button"
                    key={fixer.id}
                    className={`fixer-marker${
                      fixer.isChecked
                        ? " is-checked"
                        : ""
                    }`}
                    style={{
                      left: `${
                        fixer.xRatio *
                        100
                      }%`,

                      top: `${
                        fixer.yRatio *
                        100
                      }%`,
                    }}
                    aria-label={
                      fixer.content
                    }
                    onClick={() =>
                      onFixerSelect?.(
                        fixer,
                      )
                    }
                  >
                    !
                  </button>
                ),
              )}

              <FixerComposer
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
          </div>
        )}
      </div>
    </section>
  );
}