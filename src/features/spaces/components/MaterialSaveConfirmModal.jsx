import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import "../styles/saveStatusModal.css";

function MaterialSaveConfirmModal({
  error = "",
  isEditing = false,
  isSubmitting = false,
  uploadProgress = null,
  onCancel,
  onConfirm,
}) {
  const isProcessing = uploadProgress === 100;

  return (
    <CompactModal
      onClose={isSubmitting ? undefined : onCancel}
      labelledBy="material-save-confirm-modal-title"
      describedBy="material-save-confirm-modal-description"
      className={`save-status-modal ${error ? "save-status-modal--error" : ""}`}
    >
      <div className="save-status-modal__icon-box" aria-hidden="true">
        <img src={confirmCheckIcon} alt="" />
      </div>

      <div className="save-status-modal__text">
        <h2 id="material-save-confirm-modal-title" className="save-status-modal__title">
          강의자료를 {isEditing ? "수정" : "저장"}하시겠습니까?
        </h2>
        <p id="material-save-confirm-modal-description" className="save-status-modal__description">
          선택한 강의자료를 Space에 {isEditing ? "수정" : "저장"}합니다.
        </p>
        {error && <p className="save-status-modal__error" role="alert">{error}</p>}
      </div>

      {isSubmitting && (
        <div className="save-status-modal__progress" role="status" aria-live="polite">
          <div
            className={`save-status-modal__progress-track${uploadProgress === null ? " is-indeterminate" : ""}`}
            role="progressbar"
            aria-label="강의자료 업로드 진행률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={uploadProgress ?? undefined}
          >
            <span style={uploadProgress === null ? undefined : { width: `${uploadProgress}%` }} />
          </div>
          <p className="save-status-modal__progress-label">
            {isProcessing
              ? "파일 전송 완료 · 서버에서 처리 중..."
              : uploadProgress === null
                ? "파일 전송 준비 중..."
                : `파일 전송 중 · ${uploadProgress}%`}
          </p>
        </div>
      )}

      <ModalActions
        className="save-confirm-modal__actions"
        onCancel={onCancel}
        onConfirm={onConfirm}
        confirmText={isSubmitting ? "업로드 중..." : error ? "다시 시도" : isEditing ? "수정" : "저장"}
        confirmType="submit"
        confirmDisabled={isSubmitting}
        cancelDisabled={isSubmitting}
      />
    </CompactModal>
  );
}

export default MaterialSaveConfirmModal;
