import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import PageUpdateIcon from "../../../assets/icons/page-update.svg";
import "../styles/slide-change-notice.css";

export default function DocumentChangesModal({ count, open, onClose, onMove }) {
  if (!open || !count) return null;
  return (
    <CompactModal className="document-changes-modal" onClose={onClose}
      labelledBy="document-changes-title" describedBy="document-changes-description">
      <div className="document-changes-modal__content">
        <div className="document-changes-modal__icon" aria-hidden="true"><img src={PageUpdateIcon} alt="" /></div>
        <div className="document-changes-modal__text">
          <h2 id="document-changes-title">수정된 페이지가 {count}개 있습니다</h2>
          <p id="document-changes-description">해당 페이지로 이동하시겠습니까?</p>
        </div>
      </div>
      <ModalActions confirmText="이동" onCancel={onClose} onConfirm={onMove} />
    </CompactModal>
  );
}
