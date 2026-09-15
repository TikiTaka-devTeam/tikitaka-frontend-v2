import { useState } from "react";

import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";

const FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
];

function NoticeEditor({
  value = "",
  onChange,
}) {
  const [, forceToolbarUpdate] =
    useState(0);

  const editor = useEditor({
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
          "notice-editor__content",
      },
    },

    onUpdate: ({
      editor: currentEditor,
    }) => {
      onChange?.({
        html:
          currentEditor.getHTML(),
        text:
          currentEditor.getText(),
      });

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

  if (!editor) {
    return null;
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

  function setFontSize(size) {
    editor
      .chain()
      .focus()
      .setFontSize(size)
      .run();
  }

  function decreaseFontSize() {
    let currentIndex =
      FONT_SIZES.indexOf(
        currentFontSize,
      );

    if (currentIndex < 0) {
      currentIndex = 1;
    }

    const nextIndex =
      Math.max(
        0,
        currentIndex - 1,
      );

    setFontSize(
      FONT_SIZES[nextIndex],
    );
  }

  function increaseFontSize() {
    let currentIndex =
      FONT_SIZES.indexOf(
        currentFontSize,
      );

    if (currentIndex < 0) {
      currentIndex = 1;
    }

    const nextIndex =
      Math.min(
        FONT_SIZES.length - 1,
        currentIndex + 1,
      );

    setFontSize(
      FONT_SIZES[nextIndex],
    );
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
          className="notice-editor-toolbar__button"
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
          ↶
        </button>

        <button
          type="button"
          className="notice-editor-toolbar__button"
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
          ↷
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

        <label
          className="notice-editor-toolbar__color"
          aria-label="글자 색상"
          title="글자 색상"
        >
          <span>A</span>

          <input
            type="color"
            value={
              currentColor
            }
            onChange={(event) =>
              editor
                .chain()
                .focus()
                .setColor(
                  event.target
                    .value,
                )
                .run()
            }
          />
        </label>

        <button
          type="button"
          className="notice-editor-toolbar__button notice-editor-toolbar__size-button"
          aria-label="글자 크기 줄이기"
          onClick={
            decreaseFontSize
          }
        >
          A−
        </button>

        <button
          type="button"
          className="notice-editor-toolbar__button notice-editor-toolbar__size-button"
          aria-label="글자 크기 키우기"
          onClick={
            increaseFontSize
          }
        >
          A+
        </button>

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
          ≡
        </button>

        <button
          type="button"
          className={`notice-editor-toolbar__button notice-editor-toolbar__align-center ${
            editor.isActive({
              textAlign:
                "center",
            })
              ? "is-active"
              : ""
          }`}
          aria-label="가운데 정렬"
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
          ≡
        </button>

        <button
          type="button"
          className={`notice-editor-toolbar__button notice-editor-toolbar__align-right ${
            editor.isActive({
              textAlign:
                "right",
            })
              ? "is-active"
              : ""
          }`}
          aria-label="오른쪽 정렬"
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
          ≡
        </button>
      </div>
    </div>
  );
}

export default NoticeEditor;