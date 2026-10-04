import SpaceArchiveStatus from "../../spaces/components/SpaceArchiveStatus.jsx";
import BackIcon from "../../../assets/icons/go-back.svg";
import UndoIcon from "../../../assets/icons/undo.svg?react";
import RedoIcon from "../../../assets/icons/redo.svg?react";
import DownloadIcon from "../../../assets/icons/download.svg";
import MoreIcon from "../../../assets/icons/more2.svg";

import "../styles/lecture-header.css";

export default function LectureHeader({
  title,
  spaceName,
  onBack,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onDownload,
  onMore,
}) {
  return (
<header className="lecture-header">
      <button
        type="button"
        className="lecture-header__back"
        aria-label="뒤로가기"
        onClick={onBack}
      >
        <img src={BackIcon} alt="" draggable="false" />
      </button>

      <div className="lecture-header__titles">
        <h1>{title}</h1>
        <p><span className="lecture-header__space-name">{spaceName}</span><SpaceArchiveStatus /></p>
      </div>

      <div className="lecture-header__actions">
        <button
          type="button"
          className="lecture-header__action lecture-header__action--undo"
          aria-label="실행 취소"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <UndoIcon aria-hidden="true" />
        </button>

        <button
          type="button"
          className="lecture-header__action lecture-header__action--redo"
          aria-label="다시 실행"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <RedoIcon aria-hidden="true" />
        </button>

        <button
          type="button"
          className="lecture-header__action lecture-header__action--download"
          aria-label="다운로드"
          onClick={onDownload}
        >
          <img src={DownloadIcon} alt="" draggable="false" />
        </button>

        <button
          type="button"
          className="lecture-header__action lecture-header__action--more"
          aria-label="더보기"
          onClick={onMore}
        >
          <img src={MoreIcon} alt="" draggable="false" />
        </button>
      </div>
    </header>
  );
}
