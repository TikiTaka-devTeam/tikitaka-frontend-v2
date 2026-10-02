import {
  useEffect,
  useState,
} from "react";

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
import FixerActiveIcon from "../../../assets/icons/fixer-active.svg";
import ColorAddIcon from "../../../assets/icons/color-add.svg";

import "../styles/lecture-toolbar.css";
import "../styles/lecture-question-toolbar.css";

const QUESTION_NOTIFICATION_EVENT =
  "tikitaka:question-notification";

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

function isDarkSvgPaint(
  value,
) {
  const paint =
    String(
      value || "",
    )
      .trim()
      .toUpperCase();

  if (
    paint === "NONE" ||
    paint === "TRANSPARENT" ||
    paint === "CURRENTCOLOR" ||
    paint.startsWith("URL(")
  ) {
    return true;
  }

  if (
    paint === "BLACK"
  ) {
    return true;
  }

  const shortHex =
    /^#([0-9A-F]{3})$/.exec(
      paint,
    );

  if (shortHex) {
    const [
      red,
      green,
      blue,
    ] =
      shortHex[1]
        .split("")
        .map((value) =>
          Number.parseInt(
            `${value}${value}`,
            16,
          ),
        );

    return (
      Math.max(
        red,
        green,
        blue,
      ) <= 90
    );
  }

  const longHex =
    /^#([0-9A-F]{6})$/.exec(
      paint,
    );

  if (longHex) {
    const hex =
      longHex[1];

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

    return (
      Math.max(
        red,
        green,
        blue,
      ) <= 90
    );
  }

  return false;
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

  return svg.replace(
    /\b(fill|stroke)=(["'])([^"']+)\2/gi,
    (
      match,
      attribute,
      quote,
      paint,
    ) => {
      if (
        isDarkSvgPaint(
          paint,
        )
      ) {
        return match;
      }

      return `${attribute}=${quote}${safeColor}${quote}`;
    },
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
  const [
    hasQuestionNotification,
    setHasQuestionNotification,
  ] = useState(false);

  useEffect(() => {
    function handleQuestionNotification(
      event,
    ) {
      setHasQuestionNotification(
        Boolean(
          event?.detail
            ?.hasNotification,
        ),
      );
    }

    window.addEventListener(
      QUESTION_NOTIFICATION_EVENT,
      handleQuestionNotification,
    );

    return () => {
      window.removeEventListener(
        QUESTION_NOTIFICATION_EVENT,
        handleQuestionNotification,
      );
    };
  }, []);

  const normalizedRole =
    String(
      role ||
        "STUDENT",
    ).toUpperCase();

  const tailTools =
    normalizedRole ===
    "PROFESSOR"
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
      : normalizedRole === "ASSISTANT"
        ? [
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

  const drawingColor =
    normalizeColor(
      activeColor,
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

    if (
      tool.id ===
      "Q_LIST"
    ) {
      setHasQuestionNotification(
        false,
      );
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
                activeTool === id || (id === "Q_LIST" && panelOpen);

              const showNotification =
                id ===
                  "Q_LIST" &&
                hasQuestionNotification &&
                !isActive;

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
                    aria-label={
                      label
                    }
                    aria-pressed={
                      isActive
                    }
                    title={
                      label
                    }
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
                                drawingColor,
                                dynamicFill,
                              ),
                          }}
                        />
                      ) : (
                        <img
                          src={
                            id === "FIXER" && isActive ? FixerActiveIcon : icon
                          }
                          alt=""
                          draggable="false"
                          aria-hidden="true"
                        />
                      )}
                    </span>

                    {showNotification && (
                      <span
                        className="lecture-toolbar__question-notification"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>
              );
            },
          )}
        </div>

        <span className="lecture-toolbar__end-divider" aria-hidden="true" />
        {showDrawingControls && (
          <>

            <div className="lecture-toolbar__drawing-controls">
              <button
                type="button"
                className="lecture-toolbar__thickness-button"
                aria-label="굵기 설정"
                onClick={
                  handleThicknessClick
                }
              >
                <span
                  className="lecture-toolbar__thickness-preview"
                  style={{
                    background:
                      drawingColor,
                  }}
                />
              </button>

              <div className="lecture-toolbar__quick-palette">
                {(panelOpen ? [drawingColor] : QUICK_COLORS).map(
                  (
                    swatch,
                  ) => {
                    const isSelected =
                      isSameColor(
                        activeColor,
                        swatch,
                      );

                    return (
                      <button
                        type="button"
                        key={
                          swatch
                        }
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
