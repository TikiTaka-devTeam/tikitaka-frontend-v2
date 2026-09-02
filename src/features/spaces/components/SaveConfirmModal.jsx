import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import "../styles/saveStatusModal.css";

function SaveConfirmModal({
  mode = "create",
  onCancel,
  onConfirm,
}) {
  const isEditMode = mode === "edit";

  return (
    <CompactModal
      onClose={onCancel}
      labelledBy="save-confirm-modal-title"
      describedBy="save-confirm-modal-description"
      className="save-status-modal"
    >
      <div className="save-status-modal__icon-box" aria-hidden="true">
        <img src={confirmCheckIcon} alt="" />
      </div>

      <div className="save-status-modal__text">
        <h2
          id="save-confirm-modal-title"
          className="save-status-modal__title"
        >
          저장하시겠습니까?
        </h2>

        <p
          id="save-confirm-modal-description"
          className="save-status-modal__description"
        >
          {isEditMode
            ? "새로운 Space 정보를 업데이트 합니다."
            : "저장된 내용으로 새로운 Space를 생성합니다"}
        </p>
      </div>

      <ModalActions
        className="save-confirm-modal__actions"
        onCancel={onCancel}
        onConfirm={onConfirm}
        cancelText="취소"
        confirmText={isEditMode ? "수정" : "저장"}
      />
    </CompactModal>
  );
}

export default SaveConfirmModal;