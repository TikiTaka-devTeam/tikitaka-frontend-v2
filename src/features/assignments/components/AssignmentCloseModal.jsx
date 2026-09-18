import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";

function AssignmentCloseModal({
  type = "confirm",
  isOpen,
  isClosing = false,
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
              src={
                confirmCheckIcon
              }
              alt=""
              className="assignment-modal__check-icon"
            />
          </div>

          <div className="assignment-modal__text">
            <h2>
              {isSuccess
                ? "마감되었습니다"
                : "과제를 마감하시겠습니까?"}
            </h2>

            <p>
              {isSuccess
                ? "더 이상 과제제출을 받지 않습니다."
                : "과제 마감 시, 더 이상 과제제출을 받지않습니다."}
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="assignment-modal__actions">
            <button
              type="button"
              className="assignment-modal__confirm assignment-modal__confirm--wide"
              onClick={
                onConfirm
              }
            >
              확인
            </button>
          </div>
        ) : (
          <div className="assignment-modal__actions">
            <button
              type="button"
              className="assignment-modal__cancel"
              disabled={
                isClosing
              }
              onClick={
                onCancel
              }
            >
              취소
            </button>

            <button
              type="button"
              className="assignment-modal__confirm"
              disabled={
                isClosing
              }
              onClick={
                onConfirm
              }
            >
              {isClosing
                ? "마감 중"
                : "저장"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default AssignmentCloseModal;