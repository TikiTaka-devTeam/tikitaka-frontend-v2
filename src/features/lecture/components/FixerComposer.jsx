import { useState } from "react";
import FixerIcon from "../../../assets/icons/fixer-active.svg";
import SubmitIcon from "../../../assets/icons/submit.svg";
import SubmitActiveIcon from "../../../assets/icons/submit-professor-active.svg";
import CheckIcon from "../../../assets/icons/check-circle.svg";
import "../styles/fixer-point.css";

function pointStyle(point, pageWidth) {
  const isLeft = point.x * pageWidth + 285 > pageWidth;
  return {
    left: `${point.x * 100}%`, top: `${point.y * 100}%`,
    "--fixer-bubble-width": `${Math.min(250, Math.max(120, pageWidth - 55))}px`,
    "--fixer-side": isLeft ? "row-reverse" : "row",
    transform: isLeft ? "translate(calc(-100% + 12.5px), -50%)" : "translate(-12.5px, -50%)",
  };
}

export function FixerBubble({ fixer, pageWidth, onCheck }) {
  const [checking, setChecking] = useState(false);
  async function check() {
    if (checking || fixer.isChecked) return;
    setChecking(true);
    try { await onCheck?.(fixer); }
    finally { setChecking(false); }
  }
  return <div className={`fixer-point${fixer.isChecked ? " is-checked" : ""}`} style={pointStyle({ x: fixer.xRatio, y: fixer.yRatio }, pageWidth)}>
    <img className="fixer-point__marker" src={FixerIcon} alt="수정 메모" />
    <div className="fixer-point__bubble">
      <span title={fixer.content}>{fixer.content}</span>
      <button type="button" aria-label={fixer.isChecked ? "확인 완료된 수정 메모" : "수정 메모 확인"} disabled={checking || fixer.isChecked} onClick={check}><img src={CheckIcon} alt="" /></button>
    </div>
  </div>;
}

export default function FixerComposer({ point, pageWidth, onCancel, onSubmit }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (!point) return null;
  async function submit(event) {
    event.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try { await onSubmit(content.trim()); }
    finally { setSubmitting(false); }
  }
  return <form className="fixer-point" style={pointStyle(point, pageWidth)} onSubmit={submit} onKeyDown={(event) => {
    if (event.key === "Escape" && !submitting) { event.stopPropagation(); onCancel(); }
  }}>
    <img className="fixer-point__marker" src={FixerIcon} alt="수정 메모" />
    <div className="fixer-point__bubble">
      <input autoFocus value={content} disabled={submitting} placeholder="수정사항 입력" aria-label="수정사항 입력" onChange={(event) => setContent(event.target.value)} />
      <button type="submit" aria-label="수정 메모 등록" disabled={!content.trim() || submitting}><img src={content.trim() && !submitting ? SubmitActiveIcon : SubmitIcon} alt="" /></button>
    </div>
  </form>;
}
