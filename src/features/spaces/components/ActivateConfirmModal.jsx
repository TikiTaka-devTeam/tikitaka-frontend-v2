import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

import ActivityIcon from "../../../assets/icons/activity.svg?react";

import "../styles/activateStatusModal.css";

function ActivateConfirmModal({ onCancel, onConfirm }) {
  return (
    <CompactModal
      onClose={onCancel}
      labelledBy="activate-confirm-modal-title"
      describedBy="activate-confirm-modal-description"
      className="activate-status-modal"
    >
      <div className="activate-status-modal__icon-box" aria-hidden="true">
        <ActivityIcon className="activate-status-modal__activity-icon" />
      </div>

      <div className="activate-status-modal__text">
        <h2
          id="activate-confirm-modal-title"
          className="activate-status-modal__title"
        >
          활성화하시겠습니까?
        </h2>

        <p
          id="activate-confirm-modal-description"
          className="activate-status-modal__description"
        >
          모든 Space 참여자에게 Space가 다시 활성화됩니다
        </p>
      </div>

      <ModalActions
        className="activate-confirm-modal__actions"
        onCancel={onCancel}
        onConfirm={onConfirm}
        cancelText="취소"
        confirmText="활성화"
      />
    </CompactModal>
  );
}

export default ActivateConfirmModal;
