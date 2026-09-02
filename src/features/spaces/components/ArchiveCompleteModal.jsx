import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";

import "../styles/archiveStatusModal.css";

function ArchiveCompleteModal({
  onConfirm,
}) {
  return (
    <CompactModal
      onClose={onConfirm}
      labelledBy="archive-complete-modal-title"
      describedBy="archive-complete-modal-description"
      className="archive-status-modal"
    >
      <div
        className="archive-status-modal__icon-box"
        aria-hidden="true"
      >
        <span
          className="archive-status-modal__check-icon"
          style={{
            WebkitMaskImage: `url(${confirmCheckIcon})`,
            maskImage: `url(${confirmCheckIcon})`,
          }}
        />
      </div>

      <div className="archive-status-modal__text">
        <h2
          id="archive-complete-modal-title"
          className="archive-status-modal__title"
        >
          보관되었습니다
        </h2>

        <p
          id="archive-complete-modal-description"
          className="archive-status-modal__description"
        >
          보관된 Space에서도 자료를 계속 확인할 수 있습니다
        </p>
      </div>

      <ModalActions
        className="archive-complete-modal__actions"
        onConfirm={onConfirm}
        confirmText="확인"
        showCancel={false}
      />
    </CompactModal>
  );
}

export default ArchiveCompleteModal;