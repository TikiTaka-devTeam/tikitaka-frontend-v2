import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import FixerCursorIcon from "../../../assets/icons/fixer-active.svg";

import {
  createUuid,
} from "../utils/lectureData.js";

import {
  clamp,
  DRAW_TOOLS,
  findErasableStrokeIds,
  getDrawingCursorAppearance,
  getPointerSamples,
  getTouchDistance,
  pointDistanceInPixels,
  pointFromEvent,
  QUESTION_CURSOR,
  redrawStrokeCanvas,
} from "../utils/drawingUtils.js";

const MIN_DRAW_POINT_DISTANCE_PX =
  0.75;

const FINAL_POINT_DISTANCE_PX =
  0.05;

const STRAIGHT_HOLD_MS =
  550;

const STRAIGHT_MIN_DISTANCE_PX =
  24;

const PAGE_SWIPE_MIN_DISTANCE_PX =
  60;

const PAGE_SWIPE_AXIS_RATIO =
  1.2;

export default function useDrawingInteraction({
  activeTool,

  thickness,

  color,

  pageSize,

  privateStrokes = [],

  sharedStrokes = [],

  liveStrokes = [],

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
}) {
  const viewportRef =
    useRef(null);

  const strokeCanvasRef =
    useRef(null);

  const draftCanvasRef =
    useRef(null);
  const liveCanvasRef = useRef(null);
  const paintedSavedRef = useRef(null);

  const drawingCursorRef =
    useRef(null);

  const draftStrokeRef =
    useRef(null);

  const draftFrameRef =
    useRef(null);

  const activePointerRef =
    useRef(null);

  const erasedIdsRef =
    useRef(
      new Set(),
    );

  const touchesRef =
    useRef(
      new Map(),
    );

  const pinchRef =
    useRef(null);

  const touchGestureRef =
    useRef(null);

  const straightHoldTimerRef =
    useRef(null);

  const straightModeRef =
    useRef(false);

  const editableStrokes =
    editableLayer ===
    "SHARED"
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
    // Paint both layers in the same frame when a live stroke becomes saved,
    // avoiding a double-opacity highlighter frame. Reuse unchanged saved paths.
    const frame = requestAnimationFrame(() => {
      const previous = paintedSavedRef.current;
      if (previous?.strokes !== visibleStrokes || previous?.width !== pageSize.width ||
          previous?.height !== pageSize.height) {
        redrawStrokeCanvas(strokeCanvasRef.current, visibleStrokes, pageSize.width, pageSize.height);
        paintedSavedRef.current = { strokes: visibleStrokes, width: pageSize.width, height: pageSize.height };
      }
      redrawStrokeCanvas(liveCanvasRef.current, liveStrokes, pageSize.width, pageSize.height);
    });
    return () => cancelAnimationFrame(frame);
  }, [visibleStrokes, liveStrokes, pageSize.width, pageSize.height]);

  useEffect(() => {
    redrawStrokeCanvas(
      draftCanvasRef.current,

      draftStrokeRef.current
        ? [
            draftStrokeRef.current,
          ]
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
        draftFrameRef.current !=
        null
      ) {
        cancelAnimationFrame(
          draftFrameRef.current,
        );
      }

      if (
        straightHoldTimerRef.current !=
        null
      ) {
        window.clearTimeout(
          straightHoldTimerRef.current,
        );
      }
    },
    [],
  );

  useEffect(() => {
    drawingCursorRef.current?.hide();

    const canvas =
      draftCanvasRef.current;

    return () => {
      if (
        straightHoldTimerRef.current !=
        null
      ) {
        window.clearTimeout(
          straightHoldTimerRef.current,
        );

        straightHoldTimerRef.current =
          null;
      }

      straightModeRef.current =
        false;

      if (
        draftStrokeRef.current
      ) {
        onLiveStroke?.(
          draftStrokeRef.current,
          "CANCEL",
        );

        draftStrokeRef.current =
          null;

        activePointerRef.current =
          null;

        const context =
          canvas?.getContext(
            "2d",
          );

        if (context) {
          context.save();

          context.setTransform(
            1,
            0,
            0,
            1,
            0,
            0,
          );

          context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height,
          );

          context.restore();
        }
      }
    };
  }, [
    activeTool,
    onLiveStroke,
  ]);

  function scheduleDraftRedraw() {
    if (
      draftFrameRef.current !=
      null
    ) {
      return;
    }

    draftFrameRef.current =
      requestAnimationFrame(
        () => {
          draftFrameRef.current =
            null;

          redrawStrokeCanvas(
            draftCanvasRef.current,

            draftStrokeRef.current
              ? [
                  draftStrokeRef.current,
                ]
              : [],

            pageSize.width,
            pageSize.height,
          );
        },
      );
  }

  function clearStraightHoldTimer() {
    if (
      straightHoldTimerRef.current !=
      null
    ) {
      window.clearTimeout(
        straightHoldTimerRef.current,
      );

      straightHoldTimerRef.current =
        null;
    }
  }

  function clearDraftStroke() {
    clearStraightHoldTimer();

    straightModeRef.current =
      false;

    if (
      draftFrameRef.current !=
      null
    ) {
      cancelAnimationFrame(
        draftFrameRef.current,
      );

      draftFrameRef.current =
        null;
    }

    draftStrokeRef.current =
      null;

    redrawStrokeCanvas(
      draftCanvasRef.current,
      [],
      pageSize.width,
      pageSize.height,
    );
  }

  function hideDrawingCursor() {
    drawingCursorRef.current?.hide();
  }

  function updateDrawingCursor(
    event,
  ) {
    const canvas =
      strokeCanvasRef.current;

    if (
      !canvas ||
      event.pointerType ===
        "touch" ||
      (
        !DRAW_TOOLS.has(
          activeTool,
        ) &&
        activeTool !==
          "ERASER"
      ) ||
      !pageSize.width ||
      !pageSize.height
    ) {
      hideDrawingCursor();

      return;
    }

    const point =
      pointFromEvent(
        event,
        canvas,
      );

    if (!point) {
      hideDrawingCursor();

      return;
    }

    const appearance =
      getDrawingCursorAppearance({
        activeTool,
        thickness,
        color,

        width:
          pageSize.width,

        height:
          pageSize.height,
      });

    if (!appearance) {
      hideDrawingCursor();

      return;
    }

    drawingCursorRef.current?.show({
      x:
        point.x *
        pageSize.width,

      y:
        point.y *
        pageSize.height,

      size:
        appearance.size,

      borderWidth:
        appearance.borderWidth,

      borderColor:
        appearance.borderColor,

      background:
        appearance.background,
    });
  }

  function scheduleStraightHold() {
    clearStraightHoldTimer();

    const draftStroke =
      draftStrokeRef.current;

    if (
      !draftStroke ||
      !DRAW_TOOLS.has(
        draftStroke.tool,
      ) ||
      straightModeRef.current ||
      draftStroke.points.length <
        2
    ) {
      return;
    }

    const firstPoint =
      draftStroke.points[0];

    const lastPoint =
      draftStroke.points[
        draftStroke.points.length -
          1
      ];

    const distance =
      pointDistanceInPixels(
        firstPoint,
        lastPoint,
        pageSize.width,
        pageSize.height,
      );

    if (
      distance <
      STRAIGHT_MIN_DISTANCE_PX
    ) {
      return;
    }

    straightHoldTimerRef.current =
      window.setTimeout(
        () => {
          const currentStroke =
            draftStrokeRef.current;

          if (
            !currentStroke ||
            !DRAW_TOOLS.has(
              currentStroke.tool,
            ) ||
            currentStroke.points.length <
              2
          ) {
            return;
          }

          const startPoint =
            currentStroke.points[0];

          const endPoint =
            currentStroke.points[
              currentStroke.points
                .length - 1
            ];

          const currentDistance =
            pointDistanceInPixels(
              startPoint,
              endPoint,
              pageSize.width,
              pageSize.height,
            );

          if (
            currentDistance <
            STRAIGHT_MIN_DISTANCE_PX
          ) {
            return;
          }

          straightModeRef.current =
            true;

          currentStroke.points = [
            startPoint,
            endPoint,
          ];

          onLiveStroke?.(
            currentStroke,
            "UPDATE",
          );

          scheduleDraftRedraw();
        },
        STRAIGHT_HOLD_MS,
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
      getPointerSamples(
        event,
      );

    if (
      straightModeRef.current
    ) {
      const lastSample =
        samples[
          samples.length - 1
        ] ??
        event;

      const point =
        pointFromEvent(
          lastSample,
          canvas,
        );

      if (!point) {
        return;
      }

      const startPoint =
        draftStroke.points[0];

      draftStroke.points = [
        startPoint,
        point,
      ];

      onLiveStroke?.(
        draftStroke,
        "UPDATE",
      );

      scheduleDraftRedraw();

      return;
    }

    let changed =
      false;

    samples.forEach(
      (
        sample,
        index,
      ) => {
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
            draftStroke.points
              .length - 1
          ];

        if (!lastPoint) {
          draftStroke.points.push(
            point,
          );

          changed =
            true;

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

          changed =
            true;
        }
      },
    );

    if (changed) {
      onLiveStroke?.(
        draftStroke,
        "UPDATE",
      );

      scheduleDraftRedraw();

      if (!forceFinalPoint) {
        scheduleStraightHold();
      }
    }
  }

  function handleTouchDown(
    event,
  ) {
    const viewport =
      viewportRef.current;

    if (
      !viewport ||
      activePointerRef.current !=
        null
    ) {
      event.preventDefault();

      return;
    }

    event.preventDefault();

    hideDrawingCursor();

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    touchesRef.current.set(
      event.pointerId,
      {
        x:
          event.clientX,

        y:
          event.clientY,

        lastX:
          event.clientX,

        lastY:
          event.clientY,
      },
    );

    if (
      touchesRef.current.size ===
      1
    ) {
      touchGestureRef.current = {
        pointerId:
          event.pointerId,

        startX:
          event.clientX,

        startY:
          event.clientY,

        didPinch:
          false,
      };
    }

    if (
      touchesRef.current.size ===
      2
    ) {
      if (
        touchGestureRef.current
      ) {
        touchGestureRef.current.didPinch =
          true;
      }

      pinchRef.current = {
        startDistance:
          getTouchDistance(
            touchesRef.current,
          ),

        startZoom:
          zoom,
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
      touchesRef.current.size ===
        1 &&
      zoom > 1.001
    ) {
      viewport.scrollLeft -=
        event.clientX -
        pointer.lastX;

      viewport.scrollTop -=
        event.clientY -
        pointer.lastY;
    }

    if (
      touchesRef.current.size ===
        2 &&
      pinchRef.current
    ) {
      if (
        touchGestureRef.current
      ) {
        touchGestureRef.current.didPinch =
          true;
      }

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
          pinchRef.current
            .startZoom *
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
    const gesture =
      touchGestureRef.current;

    const wasSingleTouch =
      touchesRef.current.size ===
      1;

    let pageDirection =
      null;

    if (
      gesture &&
      gesture.pointerId ===
        event.pointerId &&
      !gesture.didPinch &&
      wasSingleTouch &&
      zoom <= 1.001
    ) {
      const deltaX =
        event.clientX -
        gesture.startX;

      const deltaY =
        event.clientY -
        gesture.startY;

      const horizontalDistance =
        Math.abs(
          deltaX,
        );

      const verticalDistance =
        Math.abs(
          deltaY,
        );

      if (
        horizontalDistance >=
          PAGE_SWIPE_MIN_DISTANCE_PX &&
        horizontalDistance >
          verticalDistance *
            PAGE_SWIPE_AXIS_RATIO
      ) {
        pageDirection =
          deltaX < 0
            ? "NEXT"
            : "PREVIOUS";
      }
    }

    touchesRef.current.delete(
      event.pointerId,
    );

    if (
      touchesRef.current.size <
      2
    ) {
      pinchRef.current =
        null;
    }

    if (
      gesture?.pointerId ===
      event.pointerId
    ) {
      touchGestureRef.current =
        null;
    }

    if (
      pageDirection ===
      "NEXT"
    ) {
      onNextPage?.();
    } else if (
      pageDirection ===
      "PREVIOUS"
    ) {
      onPreviousPage?.();
    }
  }

  function handlePointerDown(
    event,
  ) {
    if (
      event.pointerType ===
        "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    if (
      event.pointerType ===
      "touch"
    ) {
      if (
        activePointerRef.current !=
        null
      ) {
        event.preventDefault();

        return;
      }

      handleTouchDown(
        event,
      );

      return;
    }

    touchesRef.current.clear();

    pinchRef.current =
      null;

    touchGestureRef.current =
      null;

    updateDrawingCursor(
      event,
    );

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
      event.preventDefault();

      onQuestionPoint?.(
        point,
      );

      return;
    }

    if (
      activeTool ===
      "FIXER"
    ) {
      event.preventDefault();

      onFixerPoint?.(
        point,
      );

      return;
    }

    if (
      activeTool ===
      "ERASER"
    ) {
      event.preventDefault();

      const strokeIds =
        findErasableStrokeIds(
          editableStrokes,
          point,
          pageSize.width,
          pageSize.height,
          thickness,
        );

      erasedIdsRef.current =
        new Set(
          strokeIds,
        );

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

    event.preventDefault();

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

    straightModeRef.current =
      false;

    clearStraightHoldTimer();

    draftStrokeRef.current = {
      clientStrokeId:
        createUuid(),

      id:
        `draft-${Date.now()}`,

      tool:
        activeTool,

      points: [
        point,
      ],

      color,

      thickness,

      opacity,

      strokeOrder:
        editableStrokes.length +
        1,
    };

    onLiveStroke?.(
      draftStrokeRef.current,
      "UPDATE",
    );

    scheduleDraftRedraw();
  }

  function handlePointerMove(
    event,
  ) {
    if (
      event.pointerType ===
      "touch"
    ) {
      if (
        activePointerRef.current !=
          null &&
        !touchesRef.current.has(
          event.pointerId,
        )
      ) {
        event.preventDefault();

        return;
      }

      handleTouchMove(
        event,
      );

      return;
    }

    updateDrawingCursor(
      event,
    );

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

    appendPointerSamples(
      event,
    );
  }

  function finishPointer(
    event,
  ) {
    if (
      event.pointerType ===
      "touch"
    ) {
      handleTouchEnd(
        event,
      );

      return;
    }

    updateDrawingCursor(
      event,
    );

    if (
      activePointerRef.current !==
      event.pointerId
    ) {
      return;
    }

    clearStraightHoldTimer();

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

      if (
        erasedIds.length
      ) {
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

    if (
      completedStroke
    ) {
      onLiveStroke?.(
        completedStroke,
        "END",
      );

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
      if (
        touchesRef.current.has(
          event.pointerId,
        )
      ) {
        handleTouchEnd(
          event,
        );
      }

      return;
    }

    if (
      activePointerRef.current !==
      event.pointerId
    ) {
      return;
    }

    if (
      draftStrokeRef.current
    ) {
      onLiveStroke?.(
        draftStrokeRef.current,
        "CANCEL",
      );
    }

    activePointerRef.current =
      null;

    erasedIdsRef.current.clear();

    clearDraftStroke();

    hideDrawingCursor();
  }

  function handlePointerEnter(
    event,
  ) {
    updateDrawingCursor(
      event,
    );
  }

  function handlePointerLeave(
    event,
  ) {
    if (
      event.pointerType ===
      "touch"
    ) {
      return;
    }

    if (
      activePointerRef.current !==
      event.pointerId
    ) {
      hideDrawingCursor();
    }
  }

  const strokeCanvasStyle =
    activeTool ===
    "Q_POINT"
      ? {
          cursor:
            QUESTION_CURSOR,
        }
      : activeTool === "FIXER"
        ? {
            cursor: `url("${FixerCursorIcon}") 12 12, pointer`,
          }
      : DRAW_TOOLS.has(
            activeTool,
          ) ||
          activeTool ===
            "ERASER"
        ? {
            cursor:
              "none",
          }
        : undefined;

  return {
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
  };
}
