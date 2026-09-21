import DownloadIcon from "../../../assets/icons/download.svg?react";

export default function DownloadModal({
  open,
  loading,
  onCancel,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="lecture-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <section
        className="compact-modal lecture-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lecture-download-title"
      >
        <div
          className="lecture-modal__icon"
          aria-hidden="true"
        >
          <DownloadIcon />
        </div>

        <h2 id="lecture-download-title">
          강의자료 다운로드
        </h2>

        <p>
          현재 강의자료를 다운로드하시겠습니까?
        </p>

        <div className="lecture-modal__actions">
          <button
            type="button"
            className="is-secondary"
            disabled={loading}
            onClick={onCancel}
          >
            취소
          </button>

          <button
            type="button"
            className="is-primary"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading
              ? "다운로드 중"
              : "다운로드"}
          </button>
        </div>
      </section>
    </div>
  );
}
