import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import ColorAddIcon from "../../../assets/icons/color-add.svg";
import ThicknessTrackIcon from "../../../assets/icons/thickness-track.svg";
import ThicknessThumbIcon from "../../../assets/icons/thickness-thumb.svg";

import {
  getToolThicknessConfig,
} from "../utils/lectureData.js";

import "../styles/drawing-tool-options.css";

const COLORS = [
  "#EF4444",
  "#F97316",
  "#FACC15",
  "#4ADE80",
  "#6366F1",
];

const SUPPORTED_TOOLS =
  new Set([
    "PEN",
    "HIGHLIGHTER",
    "ERASER",
  ]);

const TRACK_WIDTH = 106;
const THUMB_SIZE = 13;

const ERASER_TRACK_HEIGHT = 180;
const ERASER_THUMB_SIZE = 17;

function formatThickness(
  value,
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue,
    )
  ) {
    return "0 mm";
  }

  const digits =
    Number.isInteger(
      numericValue,
    )
      ? 0
      : 1;

  return `${numericValue.toFixed(
    digits,
  )} mm`;
}

function getThicknessProgress(
  value,
  min,
  max,
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue,
    ) ||
    max <= min
  ) {
    return 0;
  }

  return Math.min(
    1,
    Math.max(
      0,
      (
        numericValue -
        min
      ) /
        (
          max -
          min
        ),
    ),
  );
}

function isSameColor(
  first,
  second,
) {
  return (
    String(
      first || "",
    ).toUpperCase() ===
    String(
      second || "",
    ).toUpperCase()
  );
}

function getAnchorSelector(
  tool,
  panel,
) {
  if (
    tool === "ERASER"
  ) {
    return '.lecture-toolbar__button[data-tool="ERASER"]';
  }

  if (
    panel ===
    "THICKNESS"
  ) {
    return ".lecture-toolbar__thickness-button";
  }

  if (
    panel ===
    "COLOR"
  ) {
    return '.lecture-toolbar__quick-swatch[aria-label="색상 더보기"]';
  }

  return null;
}

function getAnchorGap(
  tool,
) {
  return (
    tool === "ERASER"
      ? 15
      : 5
  );
}

function useAnchoredPanelPosition({
  tool,
  panel,
  panelRef,
}) {
  const [
    position,
    setPosition,
  ] = useState(null);

  const positionKey = `${tool}:${panel}`;
  const [previousPositionKey, setPreviousPositionKey] = useState(positionKey);
  if (previousPositionKey !== positionKey) {
    setPreviousPositionKey(positionKey);
    setPosition(null);
  }

  useLayoutEffect(() => {
    if (!panel) {
      return undefined;
    }

    const panelElement =
      panelRef.current;

    if (!panelElement) {
      return undefined;
    }

    const toolbarWrap =
      panelElement.closest(
        ".lecture-toolbar-wrap",
      );

    if (!toolbarWrap) {
      return undefined;
    }

    const selector =
      getAnchorSelector(
        tool,
        panel,
      );

    if (!selector) {
      return undefined;
    }

    const anchorElement =
      toolbarWrap.querySelector(
        selector,
      );

    if (!anchorElement) {
      return undefined;
    }

    let animationFrameId =
      null;

    function updatePosition() {
      const offsetParent =
        panelElement.offsetParent;

      if (!offsetParent) {
        return;
      }

      const parentRect =
        offsetParent.getBoundingClientRect();

      const wrapRect =
        toolbarWrap.getBoundingClientRect();

      const anchorRect =
        anchorElement.getBoundingClientRect();

      const panelRect =
        panelElement.getBoundingClientRect();

      const wrapStyle =
        window.getComputedStyle(
          toolbarWrap,
        );

      const lectureUnit =
        Number.parseFloat(
          wrapStyle.getPropertyValue(
            "--lecture-u",
          ),
        ) || 1;

      const gap =
        getAnchorGap(
          tool,
        ) *
        lectureUnit;

      const wrapLeft =
        wrapRect.left -
        parentRect.left +
        offsetParent.scrollLeft;

      const wrapRight =
        wrapRect.right -
        parentRect.left +
        offsetParent.scrollLeft;

      const centeredLeft =
        anchorRect.left -
        parentRect.left +
        offsetParent.scrollLeft +
        anchorRect.width /
          2 -
        panelRect.width /
          2;

      const minimumLeft =
        wrapLeft;

      const maximumLeft =
        Math.max(
          minimumLeft,
          wrapRight -
            panelRect.width,
        );

      const left =
        Math.min(
          maximumLeft,
          Math.max(
            minimumLeft,
            centeredLeft,
          ),
        );

      const top =
        anchorRect.bottom -
        parentRect.top +
        offsetParent.scrollTop +
        gap;

      setPosition({
        left,
        top,
      });
    }

    function scheduleUpdate() {
      if (
        animationFrameId !==
        null
      ) {
        window.cancelAnimationFrame(
          animationFrameId,
        );
      }

      animationFrameId =
        window.requestAnimationFrame(
          updatePosition,
        );
    }

    scheduleUpdate();

    window.addEventListener(
      "resize",
      scheduleUpdate,
    );

    window.addEventListener(
      "scroll",
      scheduleUpdate,
      true,
    );

    let resizeObserver =
      null;

    if (
      typeof ResizeObserver !==
      "undefined"
    ) {
      resizeObserver =
        new ResizeObserver(
          scheduleUpdate,
        );

      resizeObserver.observe(
        toolbarWrap,
      );

      resizeObserver.observe(
        anchorElement,
      );

      resizeObserver.observe(
        panelElement,
      );
    }

    return () => {
      if (
        animationFrameId !==
        null
      ) {
        window.cancelAnimationFrame(
          animationFrameId,
        );
      }

      window.removeEventListener(
        "resize",
        scheduleUpdate,
      );

      window.removeEventListener(
        "scroll",
        scheduleUpdate,
        true,
      );

      resizeObserver?.disconnect();
    };
  }, [
    tool,
    panel,
    panelRef,
  ]);

  return position;
}

function DrawingToolOptionsContent({
  tool,
  thickness,
  color,
  onThicknessChange,
  onColorChange,
}) {
  const [
    openPanel,
    setOpenPanel,
  ] = useState(null);

  const colorInputRef =
    useRef(null);

  const panelRef =
    useRef(null);

  useEffect(() => {
    function handleOptionsEvent(
      event,
    ) {
      const {
        panel,
        tool: eventTool,
      } =
        event.detail ?? {};

      if (
        eventTool !== tool ||
        !SUPPORTED_TOOLS.has(
          tool,
        ) ||
        tool === "ERASER"
      ) {
        return;
      }

      setOpenPanel(
        (previous) =>
          previous === panel
            ? null
            : panel,
      );
    }

    window.addEventListener(
      "tikitaka:drawing-options",
      handleOptionsEvent,
    );

    return () => {
      window.removeEventListener(
        "tikitaka:drawing-options",
        handleOptionsEvent,
      );
    };
  }, [tool]);

  const visiblePanel =
    tool === "ERASER"
      ? "ERASER"
      : openPanel;

  const panelPosition =
    useAnchoredPanelPosition({
      tool,
      panel:
        visiblePanel,
      panelRef,
    });

  const anchoredPanelStyle =
    panelPosition
      ? {
          position:
            "absolute",

          left:
            `${panelPosition.left}px`,

          top:
            `${panelPosition.top}px`,

          right:
            "auto",

          bottom:
            "auto",

          transform:
            "none",
        }
      : {
          position:
            "absolute",

          right:
            "auto",

          bottom:
            "auto",

          transform:
            "none",

          visibility:
            "hidden",
        };

  const {
    min,
    max,
    step,
    presets,
  } =
    getToolThicknessConfig(
      tool,
    );

  const progress =
    getThicknessProgress(
      thickness,
      min,
      max,
    );

  if (
    tool === "ERASER"
  ) {
    const minimumCenter =
      ERASER_THUMB_SIZE /
      2;

    const maximumCenter =
      ERASER_TRACK_HEIGHT -
      ERASER_THUMB_SIZE /
        2;

    const thumbCenter =
      minimumCenter +
      progress *
        (
          maximumCenter -
          minimumCenter
        );

    const thumbCenterPercent =
      (
        thumbCenter /
        ERASER_TRACK_HEIGHT
      ) *
      100;

    return (
      <div
        ref={panelRef}
        className="drawing-options drawing-options--eraser drawing-options--figma-eraser"
        style={
          anchoredPanelStyle
        }
      >
        <div className="drawing-options__eraser-slider">
          <span
            className="drawing-options__eraser-track"
            aria-hidden="true"
          />

          <span
            className="drawing-options__eraser-thumb"
            style={{
              top:
                `${thumbCenterPercent}%`,
            }}
            aria-hidden="true"
          />

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={
              thickness
            }
            onChange={(
              event,
            ) =>
              onThicknessChange(
                Number(
                  event.target
                    .value,
                ),
              )
            }
            aria-label={`지우개 굵기 ${formatThickness(
              thickness,
            )}`}
          />
        </div>
      </div>
    );
  }

  const minimumCenter =
    THUMB_SIZE /
    2;

  const maximumCenter =
    TRACK_WIDTH -
    THUMB_SIZE /
      2;

  const thumbCenter =
    minimumCenter +
    progress *
      (
        maximumCenter -
        minimumCenter
      );

  const thumbCenterPercent =
    (
      thumbCenter /
      TRACK_WIDTH
    ) *
    100;

  if (
    openPanel ===
    "THICKNESS"
  ) {
    return (
      <div
        ref={panelRef}
        className="drawing-options drawing-options--thickness drawing-options--figma-thickness"
        style={
          anchoredPanelStyle
        }
      >
        <strong className="drawing-options__thickness-label">
          {formatThickness(
            thickness,
          )}
        </strong>

        <div className="drawing-options__thickness-slider">
          <img
            src={
              ThicknessTrackIcon
            }
            className="drawing-options__thickness-track-image"
            alt=""
            draggable="false"
            aria-hidden="true"
          />

          <span
            className="drawing-options__thickness-thumb"
            style={{
              left:
                `${thumbCenterPercent}%`,
            }}
            aria-hidden="true"
          >
            <img
              src={
                ThicknessThumbIcon
              }
              alt=""
              draggable="false"
            />
          </span>

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={
              thickness
            }
            onChange={(
              event,
            ) =>
              onThicknessChange(
                Number(
                  event.target
                    .value,
                ),
              )
            }
            aria-label={`${
              tool ===
              "HIGHLIGHTER"
                ? "형광펜"
                : "펜"
            } 굵기 ${formatThickness(
              thickness,
            )}`}
          />
        </div>

        <div className="drawing-options__preset-row drawing-options__preset-row--figma">
          {presets.map(
            (
              preset,
              index,
            ) => (
              <button
                type="button"
                key={
                  preset
                }
                className={
                  Math.abs(
                    thickness -
                      preset,
                  ) <
                  0.001
                    ? "is-active"
                    : ""
                }
                aria-label={`굵기 ${formatThickness(
                  preset,
                )}`}
                onClick={() =>
                  onThicknessChange(
                    preset,
                  )
                }
              >
                <span
                  className={`drawing-options__preset-line ${
                    index ===
                    0
                      ? "drawing-options__preset-line--thin"
                      : index ===
                          1
                        ? "drawing-options__preset-line--medium"
                        : "drawing-options__preset-line--thick"
                  }`}
                />
              </button>
            ),
          )}
        </div>
      </div>
    );
  }

  if (
    openPanel ===
    "COLOR"
  ) {
    return (
      <div
        ref={panelRef}
        className="drawing-options drawing-options--colors"
        style={
          anchoredPanelStyle
        }
      >
        {COLORS.map(
          (swatch) => {
            const isSelected =
              isSameColor(
                color,
                swatch,
              );

            return (
              <button
                type="button"
                key={
                  swatch
                }
                className={
                  isSelected
                    ? "is-active"
                    : ""
                }
                style={{
                  background:
                    swatch,
                }}
                aria-label={`색상 ${swatch}`}
                aria-pressed={
                  isSelected
                }
                onClick={() =>
                  onColorChange(
                    swatch,
                  )
                }
              />
            );
          },
        )}

        <button
          type="button"
          className="drawing-options__color-add"
          aria-label="사용자 색상 선택"
          onClick={() =>
            colorInputRef.current?.click()
          }
        >
          <img
            src={
              ColorAddIcon
            }
            alt=""
            draggable="false"
            aria-hidden="true"
          />
        </button>

        <input
          ref={
            colorInputRef
          }
          className="drawing-options__native-color-input"
          type="color"
          value={
            /^#[0-9a-f]{6}$/i.test(
              String(
                color || "",
              ),
            )
              ? color
              : "#6366F1"
          }
          tabIndex={-1}
          aria-hidden="true"
          onChange={(
            event,
          ) =>
            onColorChange(
              event.target.value,
            )
          }
        />
      </div>
    );
  }

  return null;
}

export default function DrawingToolOptions(
  props,
) {
  const {
    tool,
  } = props;

  if (
    !SUPPORTED_TOOLS.has(
      tool,
    )
  ) {
    return null;
  }

  return (
    <DrawingToolOptionsContent
      key={tool}
      {...props}
    />
  );
}
