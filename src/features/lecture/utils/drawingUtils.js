import { HIGHLIGHTER_OPACITY } from "./lectureData.js";

export const DRAW_TOOLS = new Set([
  "PEN",
  "HIGHLIGHTER",
]);

const QUESTION_CURSOR_SVG = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="35"
  height="35"
  viewBox="0 0 35 35"
>
  <path
    d="
      M17.5 0
      A17.5 17.5 0 0 1 35 17.5
      A17.5 17.5 0 0 1 17.5 35
      H3
      A3 3 0 0 1 0 32
      V17.5
      A17.5 17.5 0 0 1 17.5 0
      Z
    "
    fill="#2E6BFF"
  />
</svg>
`;

export const QUESTION_CURSOR =
  `url("data:image/svg+xml,${encodeURIComponent(
    QUESTION_CURSOR_SVG,
  )}") 17 17, pointer`;

export function clamp(
  value,
  min,
  max,
) {
  return Math.min(
    Math.max(
      value,
      min,
    ),
    max,
  );
}

export function pointFromEvent(
  event,
  canvas,
) {
  const rect =
    canvas.getBoundingClientRect();

  if (
    !rect.width ||
    !rect.height
  ) {
    return null;
  }

  return {
    x: clamp(
      (
        event.clientX -
        rect.left
      ) / rect.width,
      0,
      1,
    ),

    y: clamp(
      (
        event.clientY -
        rect.top
      ) / rect.height,
      0,
      1,
    ),
  };
}

export function getPointerSamples(
  event,
) {
  const nativeEvent =
    event.nativeEvent ??
    event;

  if (
    typeof nativeEvent.getCoalescedEvents ===
    "function"
  ) {
    const samples =
      nativeEvent.getCoalescedEvents();

    if (samples.length) {
      return [
        ...samples,
        nativeEvent,
      ];
    }
  }

  return [
    nativeEvent,
  ];
}

export function pointDistanceInPixels(
  first,
  second,
  width,
  height,
) {
  return Math.hypot(
    (
      second.x -
      first.x
    ) * width,

    (
      second.y -
      first.y
    ) * height,
  );
}

export function getStrokeLineWidth(
  thickness,
  width,
  height,
) {
  const baseSize =
    Math.min(
      width,
      height,
    );

  return Math.max(
    0.5,
    Number(
      thickness ||
        0.0045,
    ) * baseSize,
  );
}

export function getEraserRadius(
  thickness,
  width,
  height,
) {
  const baseSize =
    Math.min(
      width,
      height,
    );

  return Math.max(
    6,
    Number(
      thickness ||
        0.016,
    ) *
      baseSize *
      0.65,
  );
}

function hexToRgba(
  color,
  alpha,
) {
  const normalized =
    String(
      color || "",
    ).trim();

  const match =
    /^#([0-9a-f]{6})$/i.exec(
      normalized,
    );

  if (!match) {
    return color;
  }

  const hex =
    match[1];

  const red =
    Number.parseInt(
      hex.slice(0, 2),
      16,
    );

  const green =
    Number.parseInt(
      hex.slice(2, 4),
      16,
    );

  const blue =
    Number.parseInt(
      hex.slice(4, 6),
      16,
    );

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function drawStroke(
  context,
  stroke,
  width,
  height,
) {
  const points =
    stroke.points ??
    [];

  if (!points.length) {
    return;
  }

  const lineWidth =
    getStrokeLineWidth(
      stroke.thickness,
      width,
      height,
    );

  context.save();

  context.lineCap =
    "round";

  context.lineJoin =
    "round";

  context.lineWidth =
    lineWidth;

  context.strokeStyle =
    stroke.color ||
    "#212326";

  context.fillStyle =
    stroke.color ||
    "#212326";

  const opacity = Number(
    stroke.opacity ??
      (stroke.tool === "HIGHLIGHTER" ? HIGHLIGHTER_OPACITY : 1),
  );
  context.globalAlpha =
    stroke.tool === "HIGHLIGHTER"
      ? Math.min(opacity, HIGHLIGHTER_OPACITY)
      : opacity;

  if (
    points.length ===
    1
  ) {
    context.beginPath();

    context.arc(
      points[0].x *
        width,

      points[0].y *
        height,

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
    points[0].x *
      width,

    points[0].y *
      height,
  );

  if (
    points.length ===
    2
  ) {
    context.lineTo(
      points[1].x *
        width,

      points[1].y *
        height,
    );
  } else {
    for (
      let index = 1;
      index <
      points.length - 1;
      index += 1
    ) {
      const current =
        points[index];

      const next =
        points[
          index + 1
        ];

      const midpointX =
        (
          current.x +
          next.x
        ) / 2;

      const midpointY =
        (
          current.y +
          next.y
        ) / 2;

      context.quadraticCurveTo(
        current.x *
          width,

        current.y *
          height,

        midpointX *
          width,

        midpointY *
          height,
      );
    }

    const lastPoint =
      points[
        points.length - 1
      ];

    context.quadraticCurveTo(
      lastPoint.x *
        width,

      lastPoint.y *
        height,

      lastPoint.x *
        width,

      lastPoint.y *
        height,
    );
  }

  context.stroke();

  context.restore();
}

export function redrawStrokeCanvas(
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
    window.devicePixelRatio ||
    1;

  const canvasWidth =
    Math.round(
      width *
        pixelRatio,
    );

  const canvasHeight =
    Math.round(
      height *
        pixelRatio,
    );

  if (
    canvas.width !==
    canvasWidth
  ) {
    canvas.width =
      canvasWidth;
  }

  if (
    canvas.height !==
    canvasHeight
  ) {
    canvas.height =
      canvasHeight;
  }

  const cssWidth =
    `${width}px`;

  const cssHeight =
    `${height}px`;

  if (
    canvas.style.width !==
    cssWidth
  ) {
    canvas.style.width =
      cssWidth;
  }

  if (
    canvas.style.height !==
    cssHeight
  ) {
    canvas.style.height =
      cssHeight;
  }

  const context =
    canvas.getContext(
      "2d",
    );

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

  strokes.forEach(
    (stroke) => {
      drawStroke(
        context,
        stroke,
        width,
        height,
      );
    },
  );
}

export function distanceToSegment(
  px,
  py,
  x1,
  y1,
  x2,
  y2,
) {
  const dx =
    x2 - x1;

  const dy =
    y2 - y1;

  if (
    dx === 0 &&
    dy === 0
  ) {
    return Math.hypot(
      px - x1,
      py - y1,
    );
  }

  const t =
    clamp(
      (
        (
          px - x1
        ) * dx +
        (
          py - y1
        ) * dy
      ) /
        (
          dx * dx +
          dy * dy
        ),
      0,
      1,
    );

  const closestX =
    x1 +
    t * dx;

  const closestY =
    y1 +
    t * dy;

  return Math.hypot(
    px -
      closestX,

    py -
      closestY,
  );
}

export function findErasableStrokeIds(
  strokes,
  point,
  width,
  height,
  thickness,
) {
  const radius =
    getEraserRadius(
      thickness,
      width,
      height,
    );

  const pointerX =
    point.x *
    width;

  const pointerY =
    point.y *
    height;

  return strokes
    .filter(
      (stroke) => {
        const points =
          stroke.points ??
          [];

        if (!points.length) {
          return false;
        }

        if (
          points.length ===
          1
        ) {
          return (
            Math.hypot(
              pointerX -
                points[0].x *
                  width,

              pointerY -
                points[0].y *
                  height,
            ) <= radius
          );
        }

        for (
          let index = 1;
          index <
          points.length;
          index += 1
        ) {
          const previous =
            points[
              index - 1
            ];

          const current =
            points[index];

          const distance =
            distanceToSegment(
              pointerX,
              pointerY,

              previous.x *
                width,

              previous.y *
                height,

              current.x *
                width,

              current.y *
                height,
            );

          if (
            distance <=
            radius
          ) {
            return true;
          }
        }

        return false;
      },
    )
    .map(
      (stroke) =>
        stroke.id,
    )
    .filter(Boolean);
}

export function getTouchDistance(
  pointerMap,
) {
  const pointers =
    Array.from(
      pointerMap.values(),
    );

  if (
    pointers.length < 2
  ) {
    return 0;
  }

  return Math.hypot(
    pointers[0].x -
      pointers[1].x,

    pointers[0].y -
      pointers[1].y,
  );
}

export function getDrawingCursorAppearance({
  activeTool,
  thickness,
  color,
  width,
  height,
}) {
  if (
    !width ||
    !height
  ) {
    return null;
  }

  if (
    activeTool === "ERASER"
  ) {
    const radius =
      getEraserRadius(
        thickness,
        width,
        height,
      );

    return {
      size:
        radius * 2,

      borderWidth: 1,

      borderColor:
        "#6B7280",

      background:
        "rgba(255, 255, 255, 0.08)",
    };
  }

  const lineWidth =
    getStrokeLineWidth(
      thickness,
      width,
      height,
    );

  if (
    activeTool ===
    "HIGHLIGHTER"
  ) {
    const highlighterColor =
      color ||
      "#FACC15";

    return {
      size:
        Math.max(
          6,
          lineWidth,
        ),

      borderWidth: 0,

      borderColor:
        "transparent",

      background:
        hexToRgba(
          highlighterColor,
          HIGHLIGHTER_OPACITY,
        ),
    };
  }

  if (
    activeTool === "PEN"
  ) {
    const penColor =
      color ||
      "#212326";

    return {
      size:
        Math.max(
          4,
          lineWidth,
        ),

      borderWidth: 0,

      borderColor:
        "transparent",

      background:
        penColor,
    };
  }

  return null;
}
