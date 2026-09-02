import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";

import "../styles/deleteStatusModal.css";

function DeleteCompleteModal({ onConfirm }) {
  return (
    <CompactModal
      onClose={onConfirm}
      labelledBy="delete-complete-modal-title"
      describedBy="delete-complete-modal-description"
      className="delete-status-modal"
    >
      <div className="delete-status-modal__icon-box" aria-hidden="true">
        <span
          className="delete-status-modal__check-icon"
          style={{
            WebkitMaskImage: `url("${confirmCheckIcon}")`,
            maskImage: `url("${confirmCheckIcon}")`,
          }}
        />
      </div>

      <div className="delete-status-modal__text">
        <h2
          id="delete-complete-modal-title"
          className="delete-status-modal__title"
        >
          삭제되었습니다
        </h2>

        <p
          id="delete-complete-modal-description"
          className="delete-status-modal__description"
        >
          삭제한 Space는 다시 복구할 수 없습니다
        </p>
      </div>

      <ModalActions
        className="delete-complete-modal__actions"
        onConfirm={onConfirm}
        confirmText="확인"
        showCancel={false}
      />
    </CompactModal>
  );
}

export default DeleteCompleteModal;
