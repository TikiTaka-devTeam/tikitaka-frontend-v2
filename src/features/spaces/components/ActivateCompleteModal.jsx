import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";

import "../styles/activateStatusModal.css";

function ActivateCompleteModal({
  onConfirm,
}) {
  return (
    <CompactModal
      onClose={onConfirm}
      labelledBy="activate-complete-modal-title"
      describedBy="activate-complete-modal-description"
      className="activate-status-modal"
    >
      <div
        className="activate-status-modal__icon-box"
        aria-hidden="true"
      >
        <span
          className="activate-status-modal__check-icon"
          style={{
            WebkitMaskImage: `url(${confirmCheckIcon})`,
            maskImage: `url(${confirmCheckIcon})`,
          }}
        />
      </div>

      <div className="activate-status-modal__text">
        <h2
          id="activate-complete-modal-title"
          className="activate-status-modal__title"
        >
          Space가 활성화되었습니다
        </h2>

        <p
          id="activate-complete-modal-description"
          className="activate-status-modal__description"
        >
          다시 자료들을 확인하실 수 있습니다
        </p>
      </div>

      <ModalActions
        className="activate-complete-modal__actions"
        onConfirm={onConfirm}
        confirmText="확인"
        showCancel={false}
      />
    </CompactModal>
  );
}

export default ActivateCompleteModal;