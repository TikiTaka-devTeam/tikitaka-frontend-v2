import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import "../styles/saveStatusModal.css";

function SaveCompleteModal({ mode = "create", onConfirm }) {
  const isEditMode = mode === "edit";

  return (
    <CompactModal
      onClose={onConfirm}
      labelledBy="save-complete-modal-title"
      describedBy="save-complete-modal-description"
      className="save-status-modal"
    >
      <div className="save-status-modal__icon-box" aria-hidden="true">
        <img src={confirmCheckIcon} alt="" />
      </div>

      <div className="save-status-modal__text">
        <h2 id="save-complete-modal-title" className="save-status-modal__title">
          저장되었습니다
        </h2>

        <p
          id="save-complete-modal-description"
          className="save-status-modal__description"
        >
          {isEditMode
            ? "새로운 Space 정보를 저장했습니다"
            : "새로운 Space가 생성되었습니다!"}
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

export default SaveCompleteModal;
