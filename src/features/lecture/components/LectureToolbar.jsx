import PenIcon from "../../../assets/icons/pen.svg";
import EraserIcon from "../../../assets/icons/eraser.svg";
import HighlighterIcon from "../../../assets/icons/highlighter.svg";
import ShapeIcon from "../../../assets/icons/shape.svg";
import LassoIcon from "../../../assets/icons/lasso.svg";
import ImageAddIcon from "../../../assets/icons/image-add.svg";
import KeyboardIcon from "../../../assets/icons/keyboard.svg";
import QuestionIcon from "../../../assets/icons/question.svg";
import QuestionListIcon from "../../../assets/icons/question-list.svg";
import FixerIcon from "../../../assets/icons/fixer.svg";

import "../styles/lecture-toolbar.css";

const COMMON_TOOLS = [
  {
    id: "PEN",
    label: "펜",
    icon: PenIcon,
  },
  {
    id: "ERASER",
    label: "지우개",
    icon: EraserIcon,
  },
  {
    id: "HIGHLIGHTER",
    label: "형광펜",
    icon: HighlighterIcon,
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

export default function LectureToolbar({
  role,
  activeTool,
  panelOpen,
  onToolChange,
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

  const tools = [...COMMON_TOOLS, ...tailTools];

  function handleToolClick(tool) {
    if (tool.uiOnly) {
      onUnsupportedTool?.(tool.id);
      return;
    }

    onToolChange(tool.id);
  }

  return (
    <div
      className={`lecture-toolbar lecture-toolbar--figma${
        panelOpen ? " lecture-toolbar--panel" : ""
      }`}
    >
      <div className="lecture-toolbar__inner">
        {tools.map(({ id, label, icon, uiOnly }) => (
          <div
            className="lecture-toolbar__slot"
            key={id}
          >
            <button
              type="button"
              className={`lecture-toolbar__button${
                activeTool === id ? " is-active" : ""
              }`}
              data-tool={id}
              aria-label={label}
              aria-pressed={activeTool === id}
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
                <img
                  src={icon}
                  alt=""
                  draggable="false"
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>
        ))}

        <span
          className="lecture-toolbar__end-divider"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}