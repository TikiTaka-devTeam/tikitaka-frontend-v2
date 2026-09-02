import { useState } from "react";

import ModalActions from "../../../components/common/ModalActions.jsx";
import ModalBackdrop from "../../../components/common/ModalBackdrop.jsx";

import "../styles/joinSpaceModal.css";

function JoinSpaceModal({
  onClose,
  onJoin,
  isSubmitting = false,
}) {
  const [spaceCode, setSpaceCode] =
    useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedSpaceCode =
      spaceCode.trim();

    if (
      !trimmedSpaceCode ||
      isSubmitting
    ) {
      return;
    }

    onJoin?.(trimmedSpaceCode);
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <form
        className="join-space-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-space-modal-title"
        aria-describedby="join-space-modal-description"
        onSubmit={handleSubmit}
      >
        <div className="join-space-modal__header">
          <h2
            id="join-space-modal-title"
            className="join-space-modal__title"
          >
            참여 신청
          </h2>

          <p
            id="join-space-modal-description"
            className="join-space-modal__description"
          >
            Space 코드를 입력하여 Space에
            참여하세요
          </p>
        </div>

        <div className="join-space-modal__body">
          <input
            className={`join-space-modal__input ${
              spaceCode.trim()
                ? "has-value"
                : ""
            }`}
            type="text"
            value={spaceCode}
            placeholder="SPACECODE"
            aria-label="Space 코드"
            disabled={isSubmitting}
            onChange={(event) =>
              setSpaceCode(
                event.target.value,
              )
            }
            autoFocus
          />
        </div>

        <div className="join-space-modal__footer">
          <ModalActions
            className="join-space-modal__actions"
            onCancel={onClose}
            cancelText="취소"
            confirmText={
              isSubmitting
                ? "신청 중"
                : "신청"
            }
            confirmType="submit"
            confirmDisabled={
              isSubmitting ||
              !spaceCode.trim()
            }
          />
        </div>
      </form>
    </ModalBackdrop>
  );
}

export default JoinSpaceModal;