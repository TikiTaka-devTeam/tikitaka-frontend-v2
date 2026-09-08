import DeleteIcon from "../../../assets/icons/delete.svg?react";
import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

import "../styles/deleteStatusModal.css";

function MaterialDeleteConfirmModal({
  error = "",
  isDeleting = false,
  onCancel,
  onConfirm,
}) {
  return (
    <CompactModal
      onClose={onCancel}
      labelledBy="material-delete-confirm-modal-title"
      describedBy="material-delete-confirm-modal-description"
      className={`delete-status-modal material-delete-confirm-modal ${
        error ? "delete-status-modal--error" : ""
      }`}
    >
      <div className="delete-status-modal__icon-box" aria-hidden="true">
        <DeleteIcon className="delete-status-modal__delete-icon" />
      </div>
      <div className="delete-status-modal__text">
        <h2 id="material-delete-confirm-modal-title" className="delete-status-modal__title">
          삭제하시겠습니까?
        </h2>
        <p
          id="material-delete-confirm-modal-description"
          className="delete-status-modal__description delete-status-modal__description--danger"
        >
          삭제한 강의자료는 다시 복구할 수 없습니다
        </p>
        {error && <p className="delete-status-modal__error" role="alert">{error}</p>}
      </div>
      <ModalActions
        className="delete-confirm-modal__actions"
        onCancel={onCancel}
        onConfirm={onConfirm}
        confirmText={isDeleting ? "삭제 중..." : "삭제"}
        confirmDisabled={isDeleting}
      />
    </CompactModal>
  );
}

export default MaterialDeleteConfirmModal;
