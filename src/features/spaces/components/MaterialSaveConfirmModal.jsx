import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import "../styles/saveStatusModal.css";

function MaterialSaveConfirmModal({
  error = "",
  isEditing = false,
  isSubmitting = false,
  onCancel,
  onConfirm,
}) {
  return (
    <CompactModal
      onClose={onCancel}
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

      <ModalActions
        className="save-confirm-modal__actions"
        onCancel={onCancel}
        onConfirm={onConfirm}
        confirmText={isSubmitting ? "업로드 중..." : isEditing ? "수정" : "저장"}
        confirmDisabled={isSubmitting}
      />
    </CompactModal>
  );
}

export default MaterialSaveConfirmModal;
