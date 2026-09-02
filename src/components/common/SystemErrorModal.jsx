import systemErrorIcon from "../../assets/icons/system-error.svg";
import CompactModal from "./CompactModal.jsx";
import ModalActions from "./ModalActions.jsx";
import "./systemErrorModal.css";

function SystemErrorModal({ onInquiry, onClose }) {
  return (
    <CompactModal
      onClose={onClose}
      backdropClassName="modal-backdrop--light"
      labelledBy="system-error-modal-title"
      describedBy="system-error-modal-description"
      className="system-error-modal"
    >
      <div className="system-error-modal__icon-box" aria-hidden="true">
        <img src={systemErrorIcon} alt="" />
      </div>

      <div className="system-error-modal__text">
        <h2 id="system-error-modal-title">시스템 오류</h2>
        <p id="system-error-modal-description">
          불편을 끼쳐 죄송합니다. 빠른 시일 내에 수정하겠습니다.
        </p>
      </div>

      <ModalActions
        className="system-error-modal__actions"
        onCancel={onInquiry}
        onConfirm={onClose}
        cancelText="문의"
        confirmText="닫기"
      />
    </CompactModal>
  );
}

export default SystemErrorModal;
