import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";

import "../styles/saveStatusModal.css";

function JoinCompleteModal({ onConfirm }) {
  return (
    <CompactModal
      onClose={onConfirm}
      labelledBy="join-complete-modal-title"
      describedBy="join-complete-modal-description"
      className="save-status-modal"
    >
      <div className="save-status-modal__icon-box" aria-hidden="true">
        <img src={confirmCheckIcon} alt="" />
      </div>

      <div className="save-status-modal__text">
        <h2 id="join-complete-modal-title" className="save-status-modal__title">
          참여 신청이 완료되었습니다
        </h2>

        <p
          id="join-complete-modal-description"
          className="save-status-modal__description"
        >
          이제 새로운 Space를 만나보세요!
        </p>
      </div>

      <ModalActions
        className="save-complete-modal__actions"
        onConfirm={onConfirm}
        confirmText="확인"
        showCancel={false}
      />
    </CompactModal>
  );
}

export default JoinCompleteModal;
