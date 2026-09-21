import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

import DeleteIcon from "../../../assets/icons/delete.svg?react";

import "../styles/deleteStatusModal.css";

function DeleteConfirmModal({
  description = "삭제한 Space는 다시 복구할 수 없습니다",
  error = "",
  isConfirming = false,
  onCancel,
  onConfirm,
}) {
  return (
    <CompactModal
      onClose={isConfirming ? undefined : onCancel}
      labelledBy="delete-confirm-modal-title"
      describedBy="delete-confirm-modal-description"
      className="delete-status-modal"
    >
      <div className="delete-status-modal__icon-box" aria-hidden="true">
        <DeleteIcon className="delete-status-modal__delete-icon" />
      </div>

      <div className="delete-status-modal__text">
        <h2
          id="delete-confirm-modal-title"
          className="delete-status-modal__title"
        >
          삭제하시겠습니까?
        </h2>

        <p
          id="delete-confirm-modal-description"
          className="delete-status-modal__description delete-status-modal__description--danger"
        >
          {description}
        </p>
        {error && <p className="delete-status-modal__error" role="alert">{error}</p>}
      </div>

      <ModalActions
        className="delete-confirm-modal__actions"
        onCancel={onCancel}
        onConfirm={onConfirm}
        cancelText="취소"
        confirmText={isConfirming ? "삭제 중" : "삭제"}
        cancelDisabled={isConfirming}
        confirmDisabled={isConfirming}
      />
    </CompactModal>
  );
}

export default DeleteConfirmModal;
