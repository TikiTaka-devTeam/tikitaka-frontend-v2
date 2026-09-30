import DownloadDocumentIcon from "../../../assets/icons/download-document.svg";

import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

export default function DownloadModal({
  open,
  loading,
  completed = false,
  onCancel,
  onConfirm,
  onComplete,
}) {
  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (loading) {
      return;
    }

    if (completed) {
      onComplete?.();
      return;
    }

    onCancel?.();
  };

  return (
    <CompactModal
      className="lecture-modal"
      onClose={handleClose}
      labelledBy="lecture-download-title"
      describedBy="lecture-download-description"
    >
      <div
        className="compact-modal__icon lecture-modal__icon"
        aria-hidden="true"
      >
        <img
          src={DownloadDocumentIcon}
          alt=""
          draggable="false"
        />
      </div>

      <div className="compact-modal__text">
        <h2 id="lecture-download-title">
          {completed
            ? "강의자료를 다운로드했습니다."
            : "강의자료를 다운로드하시겠습니까?"}
        </h2>

        <p id="lecture-download-description">
          {completed
            ? "강의자료를 다운로드했습니다."
            : "해당 강의자료를 다운로드합니다"}
        </p>
      </div>

      {completed ? (
        <ModalActions
          showCancel={false}
          confirmText="확인"
          onConfirm={onComplete}
        />
      ) : (
        <ModalActions
          cancelText="취소"
          confirmText={
            loading
              ? "다운로드 중"
              : "다운로드"
          }
          cancelDisabled={loading}
          confirmDisabled={loading}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )}
    </CompactModal>
  );
}