import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

import ArchiveIcon from "../../../assets/icons/archive.svg?react";

import "../styles/archiveStatusModal.css";

function ArchiveConfirmModal({
  onCancel,
  onConfirm,
}) {
  return (
    <CompactModal
      onClose={onCancel}
      labelledBy="archive-confirm-modal-title"
      describedBy="archive-confirm-modal-description"
      className="archive-status-modal"
    >
      <div
        className="archive-status-modal__icon-box"
        aria-hidden="true"
      >
        <ArchiveIcon className="archive-status-modal__archive-icon" />
      </div>

      <div className="archive-status-modal__text">
        <h2
          id="archive-confirm-modal-title"
          className="archive-status-modal__title"
        >
          Space를 보관하시겠습니까?
        </h2>

        <p
          id="archive-confirm-modal-description"
          className="archive-status-modal__description"
        >
          보관된 Space는 시간표에서 보이지 않게 됩니다
        </p>
      </div>

      <ModalActions
        className="archive-confirm-modal__actions"
        onCancel={onCancel}
        onConfirm={onConfirm}
        cancelText="취소"
        confirmText="보관하기"
      />
    </CompactModal>
  );
}

export default ArchiveConfirmModal;