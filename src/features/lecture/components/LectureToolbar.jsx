import PenIcon from "../../../assets/icons/pen.svg";
import PenColorSvg from "../../../assets/icons/pen-color.svg?raw";

import EraserIcon from "../../../assets/icons/eraser.svg";
import EraserColorSvg from "../../../assets/icons/eraser-color.svg?raw";

import HighlighterIcon from "../../../assets/icons/highlighter.svg";
import HighlighterColorSvg from "../../../assets/icons/highlighter-color.svg?raw";

import ShapeIcon from "../../../assets/icons/shape.svg";
import LassoIcon from "../../../assets/icons/lasso.svg";
import ImageAddIcon from "../../../assets/icons/image-add.svg";
import KeyboardIcon from "../../../assets/icons/keyboard.svg";
import QuestionIcon from "../../../assets/icons/question.svg";
import QuestionListIcon from "../../../assets/icons/question-list.svg";
import FixerIcon from "../../../assets/icons/fixer.svg";
import ColorAddIcon from "../../../assets/icons/color-add.svg";

import "../styles/lecture-toolbar.css";

const OPTION_TOOLS = new Set([
  "PEN",
  "HIGHLIGHTER",
]);

const COMMON_TOOLS = [
  {
    id: "PEN",
    label: "펜",
    icon: PenIcon,
    activeSvg: PenColorSvg,
    dynamicFill: true,
  },
  {
    id: "ERASER",
    label: "지우개",
    icon: EraserIcon,
    activeSvg: EraserColorSvg,
    dynamicFill: false,
  },
  {
    id: "HIGHLIGHTER",
    label: "형광펜",
    icon: HighlighterIcon,
    activeSvg: HighlighterColorSvg,
    dynamicFill: true,
  },
  {
    id: "SHAPE",
    label: "도형",
    icon: ShapeIcon,
    uiOnly: true,
  },
  {
    id: "LASSO",
    label: "올가미",
    icon: LassoIcon,
    uiOnly: true,
  },
  {
    id: "IMAGE",
    label: "이미지",
    icon: ImageAddIcon,
    uiOnly: true,
  },
  {
    id: "KEYBOARD",
    label: "키보드",
    icon: KeyboardIcon,
  },
];

const QUICK_COLORS = [
  "#212326",
  "#6366F1",
  "#FFC7A8",
  "#FFB800",
  "#38D6B1",
];

function normalizeColor(value) {
  const color = String(
    value || "",
  ).trim();

  if (
    /^#[0-9a-f]{6}$/i.test(
      color,
    )
  ) {
    return color;
  }

  return "#212326";
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

function getActiveSvgMarkup(
  svg,
  color,
  dynamicFill,
) {
  if (!dynamicFill) {
    return svg;
  }

  const safeColor =
    normalizeColor(
      color,
    );

  return svg
    .replace(
      /fill=(["'])#FFFFFF\1/gi,
      `fill="${safeColor}"`,
    )
    .replace(
      /fill=(["'])#FFF\1/gi,
      `fill="${safeColor}"`,
    )
    .replace(
      /fill=(["'])white\1/gi,
      `fill="${safeColor}"`,
    );
}

function emitDrawingOptions(
  panel,
  tool,
) {
  window.dispatchEvent(
    new CustomEvent(
      "tikitaka:drawing-options",
      {
        detail: {
          panel,
          tool,
        },
      },
    ),
  );
}

export default function LectureToolbar({
  role,
  activeTool,
  activeColor,
  panelOpen,
  onToolChange,
  onColorChange,
  onUnsupportedTool,
}) {
  const tailTools =
    role === "PROFESSOR"
      ? [
          {
            id: "FIXER",
            label: "수정 메모",
            icon: FixerIcon,
          },
          {
            id: "Q_LIST",
            label: "질문 목록",
            icon: QuestionListIcon,
          },
        ]
      : [
          {
            id: "Q_POINT",
            label: "질문 등록",
            icon: QuestionIcon,
          },
          {
            id: "Q_LIST",
            label: "질문 목록",
            icon: QuestionListIcon,
          },
        ];

  const tools = [
    ...COMMON_TOOLS,
    ...tailTools,
  ];

  const showDrawingControls =
    OPTION_TOOLS.has(
      activeTool,
    );

  function handleToolClick(
    tool,
  ) {
    if (tool.uiOnly) {
      onUnsupportedTool?.(
        tool.id,
      );

      return;
    }

    onToolChange?.(
      tool.id,
    );
  }

  function handleThicknessClick() {
    if (
      !showDrawingControls
    ) {
      return;
    }

    emitDrawingOptions(
      "THICKNESS",
      activeTool,
    );
  }

  function handleColorPopupClick() {
    if (
      !showDrawingControls
    ) {
      return;
    }

    emitDrawingOptions(
      "COLOR",
      activeTool,
    );
  }

  function handleColorClick(
    nextColor,
  ) {
    if (
      !showDrawingControls
    ) {
      return;
    }

    onColorChange?.(
      nextColor,
      activeTool,
    );
  }

  return (
    <div
      className={`lecture-toolbar lecture-toolbar--figma${
        panelOpen
          ? " lecture-toolbar--panel"
          : ""
      }`}
    >
      <div className="lecture-toolbar__inner">
        <div className="lecture-toolbar__tools">
          {tools.map(
            ({
              id,
              label,
              icon,
              activeSvg,
              dynamicFill,
              uiOnly,
            }) => {
              const isActive =
                activeTool === id;

              return (
                <div
                  className="lecture-toolbar__slot"
                  key={id}
                >
                  <button
                    type="button"
                    className={`lecture-toolbar__button${
                      isActive
                        ? " is-active"
                        : ""
                    }`}
                    data-tool={id}
                    aria-label={label}
                    aria-pressed={
                      isActive
                    }
                    title={label}
                    onClick={() =>
                      handleToolClick({
                        id,
                        label,
                        uiOnly,
                      })
                    }
                  >
                    <span className="lecture-toolbar__icon">
                      {isActive &&
                      activeSvg ? (
                        <span
                          className="lecture-toolbar__color-svg"
                          aria-hidden="true"
                          dangerouslySetInnerHTML={{
                            __html:
                              getActiveSvgMarkup(
                                activeSvg,
                                activeColor,
                                dynamicFill,
                              ),
                          }}
                        />
                      ) : (
                        <img
                          src={icon}
                          alt=""
                          draggable="false"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  </button>
                </div>
              );
            },
          )}
        </div>

        {showDrawingControls && (
          <>
            <span
              className="lecture-toolbar__end-divider"
              aria-hidden="true"
            />

            <div className="lecture-toolbar__drawing-controls">
              <button
                type="button"
                className="lecture-toolbar__thickness-button"
                aria-label="굵기 설정"
                onClick={
                  handleThicknessClick
                }
              >
                <span className="lecture-toolbar__thickness-preview" />
              </button>

              <div className="lecture-toolbar__quick-palette">
                {QUICK_COLORS.map(
                  (swatch) => {
                    const isSelected =
                      isSameColor(
                        activeColor,
                        swatch,
                      );

                    return (
                      <button
                        type="button"
                        key={swatch}
                        className={`lecture-toolbar__quick-swatch${
                          isSelected
                            ? " is-active"
                            : ""
                        }`}
                        style={{
                          background:
                            swatch,
                        }}
                        aria-label={`색상 ${swatch}`}
                        aria-pressed={
                          isSelected
                        }
                        onClick={() =>
                          handleColorClick(
                            swatch,
                          )
                        }
                      />
                    );
                  },
                )}

                <button
                  type="button"
                  className="lecture-toolbar__quick-swatch"
                  aria-label="색상 더보기"
                  onClick={
                    handleColorPopupClick
                  }
                  style={{
                    background:
                      "transparent",
                  }}
                >
                  <img
                    src={
                      ColorAddIcon
                    }
                    alt=""
                    draggable="false"
                    aria-hidden="true"
                    style={{
                      width:
                        "24px",
                      height:
                        "24px",
                      display:
                        "block",
                      pointerEvents:
                        "none",
                    }}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}