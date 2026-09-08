import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

import "../styles/saveStatusModal.css";

function MaterialSaveCompleteModal({ isEditing = false, onConfirm }) {
  return (
    <CompactModal
      onClose={onConfirm}
      labelledBy="material-save-complete-modal-title"
      describedBy="material-save-complete-modal-description"
      className="save-status-modal"
    >
      <div className="save-status-modal__icon-box" aria-hidden="true">
        <img src={confirmCheckIcon} alt="" />
      </div>

      <div className="save-status-modal__text">
        <h2
          id="material-save-complete-modal-title"
          className="save-status-modal__title"
        >
          {isEditing ? "수정되었습니다" : "등록되었습니다"}
        </h2>
        <p
          id="material-save-complete-modal-description"
          className="save-status-modal__description"
        >
          강의자료가 {isEditing ? "수정" : "등록"}되었습니다.
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

export default MaterialSaveCompleteModal;
