import { useEffect, useRef, useState } from "react";

import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";

import UndoIcon from "../../../assets/icons/undo.svg?react";
import RedoIcon from "../../../assets/icons/redo.svg?react";

const TEXT_COLORS = [
  "#454F63",
  "#EF4444",
  "#F97316",
  "#FACC15",
  "#4ADE80",
  "#6366F1",
];

function NoticeEditor({
  value = "",
  onChange,
  readOnly = false,
}) {
  const [toolbarRevision, forceToolbarUpdate] =
    useState(0);

  const [fontSizeDraft, setFontSizeDraft] =
    useState("14");

  const [isColorPickerOpen, setIsColorPickerOpen] =
    useState(false);

  const [customColor, setCustomColor] =
    useState("#454F63");

  const fontSizeInputRef = useRef(null);
  const colorButtonRef = useRef(null);
  const colorPickerRef = useRef(null);

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        horizontalRule: false,
      }),

      TextStyleKit,

      TextAlign.configure({
        types: ["paragraph"],
        alignments: [
          "left",
          "center",
          "right",
        ],
      }),
    ],

    content:
      value || "<p></p>",

    editorProps: {
      attributes: {
        class:
          readOnly
            ? "notice-detail__rich-text"
            : "notice-editor__content",
      },
    },

    onUpdate: ({
      editor: currentEditor,
    }) => {
      onChange?.(
        currentEditor.getHTML(),
      );

      forceToolbarUpdate(
        (current) =>
          current + 1,
      );
    },

    onSelectionUpdate: () => {
      forceToolbarUpdate(
        (current) =>
          current + 1,
      );
    },
  });

  useEffect(() => {
    if (readOnly && editor) {
      editor.commands.setContent(value || "<p></p>", {
        emitUpdate: false,
      });
    }
  }, [editor, readOnly, value]);

  useEffect(() => {
    if (!editor || readOnly || document.activeElement === fontSizeInputRef.current) {
      return;
    }

    const size = Number.parseInt(editor.getAttributes("textStyle").fontSize, 10);
    setFontSizeDraft(String(Number.isFinite(size) ? size : 14));
  }, [editor, readOnly, toolbarRevision]);

  useEffect(() => {
    if (!isColorPickerOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (
        !colorButtonRef.current?.contains(event.target) &&
        !colorPickerRef.current?.contains(event.target)
      ) {
        setIsColorPickerOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsColorPickerOpen(false);
        colorButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isColorPickerOpen]);

  if (!editor) {
    return null;
  }

  if (readOnly) {
    return <EditorContent editor={editor} />;
  }

  const textStyleAttributes =
    editor.getAttributes(
      "textStyle",
    );

  const currentFontFamily =
    textStyleAttributes.fontFamily ||
    "sans-serif";

  const currentFontSize =
    textStyleAttributes.fontSize ||
    "14px";

  const currentColor =
    textStyleAttributes.color ||
    "#454F63";

  function commitFontSize() {
    const size = Number(fontSizeDraft);

    if (!Number.isInteger(size) || size < 8 || size > 72) {
      setFontSizeDraft(String(Number.parseInt(currentFontSize, 10) || 14));
      return;
    }

    if (size === Number.parseInt(currentFontSize, 10)) {
      return;
    }

    editor
      .chain()
      .focus()
      .setFontSize(`${size}px`)
      .run();

    setFontSizeDraft(String(size));
  }

  function applyColor(color) {
    editor.chain().focus().setColor(color).run();
    setIsColorPickerOpen(false);
  }

  return (
    <div className="notice-editor">
      {editor.isEmpty && (
        <span className="notice-editor__placeholder">
          내용을 입력하세요...
        </span>
      )}

      <EditorContent
        editor={editor}
      />

      <div className="notice-editor-toolbar">
        <button
          type="button"
          className="notice-editor-toolbar__button notice-editor-toolbar__history-button"
          aria-label="실행 취소"
          disabled={
            !editor.can().undo()
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .undo()
              .run()
          }
        >
          <UndoIcon aria-hidden="true" />
        </button>

        <button
          type="button"
          className="notice-editor-toolbar__button notice-editor-toolbar__history-button"
          aria-label="다시 실행"
          disabled={
            !editor.can().redo()
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .redo()
              .run()
          }
        >
          <RedoIcon aria-hidden="true" />
        </button>

        <div className="notice-editor-toolbar__divider" />

        <select
          className="notice-editor-toolbar__font"
          value={
            currentFontFamily
          }
          aria-label="글꼴 선택"
          onChange={(event) =>
            editor
              .chain()
              .focus()
              .setFontFamily(
                event.target
                  .value,
              )
              .run()
          }
        >
          <option value="sans-serif">
            Sans Serif
          </option>

          <option value="Pretendard">
            Pretendard
          </option>

          <option value="Arial">
            Arial
          </option>

          <option value="Georgia">
            Georgia
          </option>
        </select>

        <div className="notice-editor-toolbar__divider" />

        <button
          type="button"
          aria-label="굵게"
          className={`notice-editor-toolbar__button notice-editor-toolbar__text-button ${
            editor.isActive(
              "bold",
            )
              ? "is-active"
              : ""
          }`}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
        >
          B
        </button>

        <button
          type="button"
          aria-label="취소선"
          className={`notice-editor-toolbar__button notice-editor-toolbar__text-button notice-editor-toolbar__strike ${
            editor.isActive(
              "strike",
            )
              ? "is-active"
              : ""
          }`}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleStrike()
              .run()
          }
        >
          S
        </button>

        <button
          type="button"
          aria-label="기울임"
          className={`notice-editor-toolbar__button notice-editor-toolbar__text-button notice-editor-toolbar__italic ${
            editor.isActive(
              "italic",
            )
              ? "is-active"
              : ""
          }`}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
        >
          I
        </button>

        <button
          type="button"
          aria-label="밑줄"
          className={`notice-editor-toolbar__button notice-editor-toolbar__text-button notice-editor-toolbar__underline ${
            editor.isActive(
              "underline",
            )
              ? "is-active"
              : ""
          }`}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleUnderline()
              .run()
          }
        >
          U
        </button>

        <div className="notice-editor-toolbar__divider" />

        <button
          ref={colorButtonRef}
          type="button"
          className="notice-editor-toolbar__color"
          aria-label="글자 색상"
          title="글자 색상"
          aria-expanded={isColorPickerOpen}
          aria-haspopup="dialog"
          style={{ "--notice-text-color": currentColor }}
          onClick={() => {
            setCustomColor(
              /^#[0-9a-f]{6}$/i.test(currentColor)
                ? currentColor.toUpperCase()
                : "#454F63",
            );
            setIsColorPickerOpen((open) => !open);
          }}
        >
          <span>A</span>
        </button>

        <label className="notice-editor-toolbar__font-size">
          <input
            ref={fontSizeInputRef}
            type="number"
            min="8"
            max="72"
            step="1"
            value={fontSizeDraft}
            aria-label="글자 크기"
            onChange={(event) => setFontSizeDraft(event.target.value)}
            onBlur={commitFontSize}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
          />
          <span>px</span>
        </label>

        <div className="notice-editor-toolbar__divider" />

        <button
          type="button"
          className={`notice-editor-toolbar__button ${
            editor.isActive({
              textAlign:
                "left",
            })
              ? "is-active"
              : ""
          }`}
          aria-label="왼쪽 정렬"
          title="왼쪽 정렬"
          aria-pressed={editor.isActive({ textAlign: "left" })}
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign(
                "left",
              )
              .run()
          }
        >
          <AlignLeft size={17} strokeWidth={2} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={`notice-editor-toolbar__button ${
            editor.isActive({
              textAlign:
                "center",
            })
              ? "is-active"
              : ""
          }`}
          aria-label="가운데 정렬"
          title="가운데 정렬"
          aria-pressed={editor.isActive({ textAlign: "center" })}
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign(
                "center",
              )
              .run()
          }
        >
          <AlignCenter size={17} strokeWidth={2} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={`notice-editor-toolbar__button ${
            editor.isActive({
              textAlign:
                "right",
            })
              ? "is-active"
              : ""
          }`}
          aria-label="오른쪽 정렬"
          title="오른쪽 정렬"
          aria-pressed={editor.isActive({ textAlign: "right" })}
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign(
                "right",
              )
              .run()
          }
        >
          <AlignRight size={17} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {isColorPickerOpen && (
        <div
          ref={colorPickerRef}
          className="notice-editor__color-popover"
          role="dialog"
          aria-label="글자 색상 선택"
        >
          <strong>글자 색상</strong>
          <div className="notice-editor__color-swatches">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="notice-editor__color-swatch"
                style={{ backgroundColor: color }}
                aria-label={`색상 ${color}`}
                aria-pressed={currentColor.toUpperCase() === color}
                onClick={() => applyColor(color)}
              />
            ))}
          </div>
          <div className="notice-editor__custom-color">
            <span
              className="notice-editor__color-preview"
              style={{ backgroundColor: /^#[0-9a-f]{6}$/i.test(customColor) ? customColor : currentColor }}
              aria-hidden="true"
            />
            <label htmlFor="notice-text-color-hex">HEX</label>
            <input
              id="notice-text-color-hex"
              type="text"
              maxLength={7}
              value={customColor}
              aria-invalid={!/^#[0-9a-f]{6}$/i.test(customColor)}
              onChange={(event) => {
                const value = event.target.value;
                setCustomColor(value.startsWith("#") ? value : `#${value}`);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (/^#[0-9a-f]{6}$/i.test(customColor)) {
                    applyColor(customColor.toUpperCase());
                  }
                }
              }}
            />
          </div>
          <button
            type="button"
            className="notice-editor__color-apply"
            disabled={!/^#[0-9a-f]{6}$/i.test(customColor)}
            onClick={() => applyColor(customColor.toUpperCase())}
          >
            적용
          </button>
        </div>
      )}
    </div>
  );
}

export default NoticeEditor;
