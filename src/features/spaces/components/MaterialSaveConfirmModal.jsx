import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import "../styles/saveStatusModal.css";

function MaterialSaveConfirmModal({ onCancel, onConfirm }) {
  return (
    <CompactModal
      onClose={onCancel}
      labelledBy="material-save-confirm-modal-title"
      describedBy="material-save-confirm-modal-description"
      className="save-status-modal"
    >
      <div className="save-status-modal__icon-box" aria-hidden="true">
        <img src={confirmCheckIcon} alt="" />
      </div>

      <div className="save-status-modal__text">
        <h2 id="material-save-confirm-modal-title" className="save-status-modal__title">
          강의자료를 저장하시겠습니까?
        </h2>
        <p id="material-save-confirm-modal-description" className="save-status-modal__description">
          선택한 강의자료를 Space에 저장합니다.
        </p>
      </div>

      <ModalActions
        className="save-confirm-modal__actions"
        onCancel={onCancel}
        onConfirm={onConfirm}
        confirmText="저장"
      />
    </CompactModal>
  );
}

export default MaterialSaveConfirmModal;
