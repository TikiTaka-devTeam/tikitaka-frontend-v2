import DownloadDocumentIcon from "../../../assets/icons/download-document.svg";

import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import "../styles/lecture-download-modal.css";

export default function DownloadModal({
  open,
  loading,
  completed = false,
  saving = false,
  error = "",
  includeShared,
  includePrivate,
  canIncludePrivate,
  onSharedChange,
  onPrivateChange,
  onCancel,
  onConfirm,
  onComplete,
}) {
  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (loading) {
      return;
    }

    if (completed) {
      onComplete?.();
      return;
    }

    onCancel?.();
  };

  return (
    <CompactModal
      className="lecture-modal lecture-download-modal"
      onClose={handleClose}
      labelledBy="lecture-download-title"
      describedBy="lecture-download-description"
    >
      <div
        className="compact-modal__icon lecture-modal__icon"
        aria-hidden="true"
      >
        <img
          src={DownloadDocumentIcon}
          alt=""
          draggable="false"
        />
      </div>

      <div className="compact-modal__text">
        <h2 id="lecture-download-title">
          {completed
            ? "강의자료를 다운로드했습니다."
            : "강의자료를 다운로드하시겠습니까?"}
        </h2>

        <p id="lecture-download-description">
          {completed
            ? "강의자료를 다운로드했습니다."
            : "포함할 필기를 선택하세요. 선택하지 않으면 원본 PDF를 다운로드합니다."}
        </p>
      </div>

      {!completed && (
        <fieldset className="lecture-download-modal__options" disabled={loading}>
          <legend className="lecture-download-modal__legend">다운로드에 포함할 필기</legend>
          <label>
            <input type="checkbox" checked={includeShared} onChange={(event) => onSharedChange(event.target.checked)} />
            교수 필기 포함
          </label>
          {canIncludePrivate && (
            <label>
              <input type="checkbox" checked={includePrivate} onChange={(event) => onPrivateChange(event.target.checked)} />
              내 필기 포함
            </label>
          )}
        </fieldset>
      )}
      {loading && <p className="lecture-download-modal__status" role="status">{saving ? "필기 저장 중…" : "PDF 생성 및 다운로드 중…"}</p>}
      {error && <p className="lecture-download-modal__error" role="alert">{error}</p>}

      {completed ? (
        <ModalActions
          showCancel={false}
          confirmText="확인"
          onConfirm={onComplete}
        />
      ) : (
        <ModalActions
          cancelText="취소"
          confirmText={
            loading
              ? saving ? "저장 중" : "다운로드 중"
              : error ? "다시 시도" : "다운로드"
          }
          cancelDisabled={loading}
          confirmDisabled={loading}
          onCancel={handleClose}
          onConfirm={onConfirm}
        />
      )}
    </CompactModal>
  );
}
