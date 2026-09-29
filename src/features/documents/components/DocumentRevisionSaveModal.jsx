import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import noteIcon from "../../../assets/icons/documents/note.svg";
import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

function DocumentRevisionSaveModal({
  error = "",
  isSaving = false,
  onCancel,
  onConfirm,
  stage,
}) {
  const isComplete = stage === "complete";
  const isProcessing = stage === "processing";
  const isFailed = stage === "failed";
  const isCanceled = stage === "canceled";
  const isTerminal = isComplete || isFailed || isCanceled;
  const titleId = `document-revision-save-${stage}-title`;
  const descriptionId = `document-revision-save-${stage}-description`;
  const title = isComplete
    ? "저장되었습니다"
    : isProcessing
      ? "강의자료를 생성하고 있습니다"
      : isFailed
        ? "저장하지 못했습니다"
        : isCanceled
          ? "저장이 취소되었습니다"
          : "저장하시겠습니까?";
  const description = isComplete
    ? "수정된 내용으로 강의자료를 업데이트했습니다"
    : isProcessing
      ? "강의자료 수정이 반영될 때까지 잠시만 기다려 주세요"
      : isFailed || isCanceled
        ? "기존 강의자료는 그대로 유지됩니다"
        : "수정된 내용으로 강의자료를 업데이트합니다";

  return (
    <CompactModal
      onClose={isProcessing ? undefined : isTerminal ? onConfirm : onCancel}
      labelledBy={titleId}
      describedBy={descriptionId}
      className={`document-revision-save-modal${error ? " document-revision-save-modal--error" : ""}`}
    >
      <div className="document-revision-save-modal__content">
        <div className="document-revision-save-modal__icon-box" aria-hidden="true">
          {isProcessing ? (
            <span className="document-revision-save-modal__spinner" />
          ) : (
            <img
              className={isComplete ? "is-complete" : "is-note"}
              src={isComplete ? confirmCheckIcon : noteIcon}
              alt=""
            />
          )}
        </div>

        <div className="document-revision-save-modal__text">
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
          {error && <p className="document-revision-save-modal__error" role="alert">{error}</p>}
        </div>
      </div>

      {!isProcessing && (
        <ModalActions
          className={isTerminal
            ? "document-revision-save-modal__actions is-complete"
            : "document-revision-save-modal__actions"}
          onCancel={onCancel}
          onConfirm={onConfirm}
          confirmDisabled={isSaving}
          confirmText={isTerminal ? "확인" : isSaving ? "요청 중..." : "저장"}
          showCancel={!isTerminal}
        />
      )}
    </CompactModal>
  );
}

export default DocumentRevisionSaveModal;
