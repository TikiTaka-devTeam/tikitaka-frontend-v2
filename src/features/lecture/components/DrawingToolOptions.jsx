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

const ERASER_PRESETS = [
  0.01,
  0.016,
  0.024,
];

const COLORS = [
  "#EF4444",
  "#F97316",
  "#FACC15",
  "#4ADE80",
  "#6366F1",
  "#212326",
];

function formatThickness(ratio) {
  return `${(ratio * 100).toFixed(2)}%`;
}

export default function DrawingToolOptions({
  tool,
  thickness,
  color,
  onThicknessChange,
  onColorChange,
}) {
  if (
    ![
      "PEN",
      "HIGHLIGHTER",
      "ERASER",
    ].includes(tool)
  ) {
    return null;
  }

  const presets =
    tool === "PEN"
      ? PEN_PRESETS
      : tool === "HIGHLIGHTER"
        ? HIGHLIGHTER_PRESETS
        : ERASER_PRESETS;

  if (tool === "ERASER") {
    return (
      <div className="drawing-options drawing-options--eraser">
        {presets.map((preset) => (
          <button
            type="button"
            key={preset}
            className={
              thickness === preset
                ? "is-active"
                : ""
            }
            onClick={() =>
              onThicknessChange(preset)
            }
            aria-label={`지우개 두께 ${formatThickness(
              preset,
            )}`}
          >
            <span
              style={{
                width: `${
                  18 + preset * 950
                }px`,
                height: `${
                  2 + preset * 190
                }px`,
              }}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="drawing-options drawing-options--thickness">
        <div className="drawing-options__range-row">
          <strong>
            {formatThickness(thickness)}
          </strong>

          <input
            type="range"
            min={
              tool === "PEN"
                ? 0.002
                : 0.006
            }
            max={
              tool === "PEN"
                ? 0.012
                : 0.025
            }
            step="0.0005"
            value={thickness}
            onChange={(event) =>
              onThicknessChange(
                Number(
                  event.target.value,
                ),
              )
            }
            aria-label="필기 두께"
          />
        </div>

        <div className="drawing-options__preset-row">
          {presets.map((preset) => (
            <button
              type="button"
              key={preset}
              className={
                thickness === preset
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                onThicknessChange(preset)
              }
              aria-label={`두께 ${formatThickness(
                preset,
              )}`}
            >
              <span
                style={{
                  height: `${Math.max(
                    3,
                    preset * 1000,
                  )}px`,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="drawing-options drawing-options--colors">
        {COLORS.map((swatch) => (
          <button
            type="button"
            key={swatch}
            className={
              color === swatch
                ? "is-active"
                : ""
            }
            style={{
              background: swatch,
            }}
            aria-label={`색상 ${swatch}`}
            onClick={() =>
              onColorChange(swatch)
            }
          />
        ))}

        <label
          className="drawing-options__custom"
          aria-label="사용자 색상 선택"
        >
          <span>+</span>

          <input
            type="color"
            value={color}
            onChange={(event) =>
              onColorChange(
                event.target.value,
              )
            }
          />
        </label>
      </div>
    </>
  );
}