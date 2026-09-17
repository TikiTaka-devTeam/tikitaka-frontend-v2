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
  const titleId = `document-revision-save-${stage}-title`;
  const descriptionId = `document-revision-save-${stage}-description`;

  return (
    <CompactModal
      onClose={isComplete ? onConfirm : onCancel}
      labelledBy={titleId}
      describedBy={descriptionId}
      className={`document-revision-save-modal${error ? " document-revision-save-modal--error" : ""}`}
    >
      <div className="document-revision-save-modal__content">
        <div className="document-revision-save-modal__icon-box" aria-hidden="true">
          <img
            className={isComplete ? "is-complete" : "is-note"}
            src={isComplete ? confirmCheckIcon : noteIcon}
            alt=""
          />
        </div>

        <div className="document-revision-save-modal__text">
          <h2 id={titleId}>
            {isComplete ? "저장되었습니다" : "저장하시겠습니까?"}
          </h2>
          <p id={descriptionId}>
            {isComplete
              ? "수정된 내용으로 강의자료를 업데이트했습니다"
              : "수정된 내용으로 강의자료를 업데이트합니다"}
          </p>
          {error && <p className="document-revision-save-modal__error" role="alert">{error}</p>}
        </div>
      </div>

      <ModalActions
        className={isComplete
          ? "document-revision-save-modal__actions is-complete"
          : "document-revision-save-modal__actions"}
        onCancel={onCancel}
        onConfirm={onConfirm}
        confirmDisabled={isSaving}
        confirmText={isComplete ? "확인" : isSaving ? "저장 중..." : "저장"}
        showCancel={!isComplete}
      />
    </CompactModal>
  );
}

export default DocumentRevisionSaveModal;
