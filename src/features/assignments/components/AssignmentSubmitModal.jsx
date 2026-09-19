import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";

function AssignmentSubmitModal({
  type = "confirm",
  isOpen,
  isSubmitting = false,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) {
    return null;
  }

  const isSuccess =
    type === "success";

  return (
    <div className="assignment-modal-backdrop">
      <section
        className="assignment-modal"
        role={
          isSuccess
            ? "dialog"
            : "alertdialog"
        }
        aria-modal="true"
      >
        <div className="assignment-modal__content">
          <div
            className="assignment-modal__icon"
            aria-hidden="true"
          >
            <img
              src={confirmCheckIcon}
              alt=""
            />
          </div>

          <div className="assignment-modal__text">
            <h2>
              {isSuccess
                ? "제출되었습니다"
                : "과제를 제출하시겠습니까?"}
            </h2>

            <p>
              {isSuccess
                ? "과제가 제출되었습니다."
                : "과제 마감 전까지 재제출이 가능합니다."}
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="assignment-modal__actions">
            <button
              type="button"
              className="assignment-modal__confirm assignment-modal__confirm--wide"
              onClick={onConfirm}
            >
              확인
            </button>
          </div>
        ) : (
          <div className="assignment-modal__actions">
            <button
              type="button"
              className="assignment-modal__cancel"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              취소
            </button>

            <button
              type="button"
              className="assignment-modal__confirm"
              disabled={isSubmitting}
              onClick={onConfirm}
            >
              {isSubmitting
                ? "제출 중"
                : "저장"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default AssignmentSubmitModal;