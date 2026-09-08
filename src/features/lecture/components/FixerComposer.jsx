import { useState } from "react";

import SendIcon from "../../../assets/icons/send.svg?react";

export default function FixerComposer({
  point,
  onCancel,
  onSubmit,
}) {
  const [content, setContent] = useState("");

  if (!point) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    onSubmit(trimmedContent);
    setContent("");
  }

  function handleCancel() {
    setContent("");
    onCancel();
  }

  return (
    <form
      className="fixer-composer"
      style={{
        left: `${point.x * 100}%`,
        top: `${point.y * 100}%`,
      }}
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        value={content}
        placeholder="수정 메모"
        aria-label="수정 메모"
        onChange={(event) => setContent(event.target.value)}
      />

      <button
        type="submit"
        className="fixer-composer__submit"
        aria-label="수정 메모 등록"
        disabled={!content.trim()}
      >
        <SendIcon />
      </button>

      <button
        type="button"
        className="fixer-composer__cancel"
        onClick={handleCancel}
      >
        취소
      </button>
    </form>
  );
}