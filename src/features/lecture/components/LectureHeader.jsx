import BackIcon from "../../../assets/icons/go-back.svg";
import UndoIcon from "../../../assets/icons/undo.svg";
import RedoIcon from "../../../assets/icons/redo.svg";
import DownloadIcon from "../../../assets/icons/download.svg";
import MoreIcon from "../../../assets/icons/more2.svg";

import "../styles/lecture-header.css";

export default function LectureHeader({
  title,
  spaceName,
  onBack,
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
        <p>{spaceName}</p>
      </div>

      <div className="lecture-header__actions">
        <button
          type="button"
          className="lecture-header__action lecture-header__action--undo"
          aria-label="실행 취소"
          onClick={onUndo}
        >
          <img src={UndoIcon} alt="" draggable="false" />
        </button>

        <button
          type="button"
          className="lecture-header__action lecture-header__action--redo"
          aria-label="다시 실행"
          onClick={onRedo}
        >
          <img src={RedoIcon} alt="" draggable="false" />
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
