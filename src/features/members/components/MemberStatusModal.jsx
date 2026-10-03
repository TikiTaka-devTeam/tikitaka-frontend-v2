import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import assistantSaveIcon from "../../../assets/icons/members/assistant-save.svg";
import LogoutIcon from "../../../assets/icons/profile-menu/logout.svg?react";

import "../styles/memberStatusModal.css";

function MemberStatusModal({
  action,
  step,
  description,
  errorMessage = "",
  isSubmitting = false,
  onCancel,
  onConfirm,
}) {
  const isApproval = action === "approval";
  const isDenial = action === "denial";
  const isPermission = action === "permission";
  const isComplete = step === "complete";
  const modalId = `member-${action}-${step}-modal`;
  const title = isDenial
    ? isComplete
      ? "거절되었습니다"
      : "거절하시겠습니까?"
    : isPermission
      ? isComplete
        ? "저장되었습니다"
        : "저장하시겠습니까?"
      : isApproval
        ? isComplete
          ? "승인되었습니다"
          : "승인하시겠습니까?"
        : isComplete
          ? "삭제되었습니다"
          : "내보내시겠습니까?";
  const confirmText = isComplete
    ? "확인"
    : isSubmitting
      ? isApproval
        ? "승인 중"
        : isDenial
          ? "거절 중"
          : isPermission
            ? "저장 중"
            : "처리 중"
      : isDenial
        ? "거절"
        : isApproval
          ? "승인"
          : isPermission
            ? "저장"
            : "내보내기";

  return (
    <CompactModal
      onClose={isSubmitting ? undefined : isComplete ? onConfirm : onCancel}
      labelledBy={`${modalId}-title`}
      describedBy={`${modalId}-description`}
      className={`member-status-modal member-status-modal--${action}${errorMessage ? " member-status-modal--error" : ""}`}
    >
      <div className="member-status-modal__icon-box" aria-hidden="true">
        {isPermission && !isComplete ? (
          <img
            className="member-status-modal__assistant-save-icon"
            src={assistantSaveIcon}
            alt=""
          />
        ) : !isApproval && !isDenial && !isPermission && !isComplete ? (
          <LogoutIcon className="member-status-modal__logout-icon" />
        ) : (
          <span
            className="member-status-modal__check-icon"
            style={{
              WebkitMaskImage: `url("${confirmCheckIcon}")`,
              maskImage: `url("${confirmCheckIcon}")`,
            }}
          />
        )}
      </div>

      <div className="member-status-modal__text">
        <h2 id={`${modalId}-title`}>{title}</h2>
        <p id={`${modalId}-description`}>{description}</p>
        {errorMessage ? (
          <p className="member-status-modal__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <ModalActions
        className={`member-status-modal__actions${isComplete ? " member-status-modal__actions--complete" : ""}`}
        onCancel={onCancel}
        onConfirm={onConfirm}
        cancelText="취소"
        confirmText={confirmText}
        confirmDisabled={isSubmitting}
        showCancel={!isComplete}
      />
    </CompactModal>
  );
}

export default MemberStatusModal;
