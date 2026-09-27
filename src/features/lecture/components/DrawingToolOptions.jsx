import {
  useEffect,
  useRef,
  useState,
} from "react";

import ColorAddIcon from "../../../assets/icons/color-add.svg";
import ThicknessTrackIcon from "../../../assets/icons/thickness-track.svg";
import ThicknessThumbIcon from "../../../assets/icons/thickness-thumb.svg";

import "../styles/drawing-tool-options.css";

const PEN_PRESETS = [
  0.003,
  0.0045,
  0.007,
];

const HIGHLIGHTER_PRESETS = [
  0.008,
  0.012,
  0.018,
];

const COLORS = [
  "#EF4444",
  "#F97316",
  "#FACC15",
  "#4ADE80",
  "#6366F1",
];

const THICKNESS_MM_SCALE =
  66.6666667;

const TRACK_WIDTH = 106;
const THUMB_SIZE = 13;

function formatThickness(
  ratio,
) {
  const millimeters =
    Number(ratio) *
    THICKNESS_MM_SCALE;

  return `${millimeters.toFixed(
    1,
  )} mm`;
}

function getThicknessConfig(
  tool,
) {
  if (
    tool === "HIGHLIGHTER"
  ) {
    return {
      min: 0.006,
      max: 0.025,
      step: 0.0005,
      presets:
        HIGHLIGHTER_PRESETS,
    };
  }

  return {
    min: 0.002,
    max: 0.012,
    step: 0.0005,
    presets: PEN_PRESETS,
  };
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
      (numericValue - min) /
        (max - min),
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

export default function DrawingToolOptions({
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

  useEffect(() => {
    setOpenPanel(null);
  }, [tool]);

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
        eventTool !== tool
      ) {
        return;
      }

      if (
        ![
          "PEN",
          "HIGHLIGHTER",
        ].includes(tool)
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

  if (
    ![
      "PEN",
      "HIGHLIGHTER",
    ].includes(tool)
  ) {
    return null;
  }

  const {
    min,
    max,
    step,
    presets,
  } =
    getThicknessConfig(tool);

  const progress =
    getThicknessProgress(
      thickness,
      min,
      max,
    );

  const minimumCenter =
    THUMB_SIZE / 2;

  const maximumCenter =
    TRACK_WIDTH -
    THUMB_SIZE / 2;

  const thumbCenter =
    minimumCenter +
    progress *
      (
        maximumCenter -
        minimumCenter
      );

  const thumbCenterPercent =
    (thumbCenter /
      TRACK_WIDTH) *
    100;

  if (
    openPanel ===
    "THICKNESS"
  ) {
    return (
      <div className="drawing-options drawing-options--thickness drawing-options--figma-thickness">
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
            value={thickness}
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
            aria-label="필기 굵기"
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
                key={preset}
                className={
                  thickness ===
                  preset
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
                    index === 0
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
    openPanel === "COLOR"
  ) {
    return (
      <div className="drawing-options drawing-options--colors">
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
                key={swatch}
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
            src={ColorAddIcon}
            alt=""
            draggable="false"
            aria-hidden="true"
          />
        </button>

        <input
          ref={colorInputRef}
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