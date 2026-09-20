import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import deleteIcon from "../../../assets/icons/delete.svg";

const MODAL_CONTENT = {
  create: {
    confirm: {
      title: "과제를 등록하시겠습니까?",
      description:
        "저장 시, 작성한 과제가 공개됩니다.",
      confirmLabel: "저장",
    },

    success: {
      title: "저장되었습니다",
      description:
        "과제가 공개되었습니다.",
      confirmLabel: "확인",
    },
  },

  edit: {
    confirm: {
      title: "과제를 수정하시겠습니까?",
      description:
        "저장 시, 작성한 과제가 공개됩니다.",
      confirmLabel: "저장",
    },

    success: {
      title: "수정 되었습니다",
      description:
        "과제가 공개되었습니다.",
      confirmLabel: "확인",
    },
  },

  delete: {
    confirm: {
      title: "삭제하시겠습니까?",
      description:
        "삭제한 과제는 다시 복구할 수 없습니다",
      confirmLabel: "삭제",
    },

    success: {
      title: "삭제되었습니다",
      description:
        "삭제한 과제는 다시 복구할 수 없습니다",
      confirmLabel: "확인",
    },
  },
};

function AssignmentManageModal({
  action = "create",
  step = "confirm",
  isOpen,
  isProcessing = false,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) {
    return null;
  }

  const actionContent =
    MODAL_CONTENT[action] ??
    MODAL_CONTENT.create;

  const content =
    actionContent[step] ??
    actionContent.confirm;

  const isSuccess =
    step === "success";

  const isDelete =
    action === "delete";

  const processingLabel =
    isDelete
      ? "삭제 중"
      : "저장 중";

  return (
    <div className="assignment-manage-modal-backdrop">
      <section
        className={`assignment-manage-modal${
          isDelete
            ? " assignment-manage-modal--delete"
            : ""
        }`}
        role={
          isSuccess
            ? "dialog"
            : "alertdialog"
        }
        aria-modal="true"
        aria-labelledby="assignment-manage-modal-title"
        aria-describedby="assignment-manage-modal-description"
      >
        <div className="assignment-manage-modal__content">
          <div
            className={`assignment-manage-modal__icon${
              isDelete
                ? " assignment-manage-modal__icon--delete"
                : ""
            }`}
            aria-hidden="true"
          >
            <img
              src={
                isDelete &&
                !isSuccess
                  ? deleteIcon
                  : confirmCheckIcon
              }
              alt=""
              className={
                isDelete &&
                !isSuccess
                  ? "assignment-manage-modal__delete-icon"
                  : "assignment-manage-modal__check-icon"
              }
            />
          </div>

          <div className="assignment-manage-modal__text">
            <h2 id="assignment-manage-modal-title">
              {content.title}
            </h2>

            <p
              id="assignment-manage-modal-description"
              className={
                isDelete &&
                !isSuccess
                  ? "is-delete-warning"
                  : undefined
              }
            >
              {
                content.description
              }
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="assignment-manage-modal__actions">
            <button
              type="button"
              className={`assignment-manage-modal__confirm assignment-manage-modal__confirm--wide${
                isDelete
                  ? " is-delete"
                  : ""
              }`}
              onClick={
                onConfirm
              }
            >
              {
                content.confirmLabel
              }
            </button>
          </div>
        ) : (
          <div className="assignment-manage-modal__actions">
            <button
              type="button"
              className="assignment-manage-modal__cancel"
              disabled={
                isProcessing
              }
              onClick={
                onCancel
              }
            >
              취소
            </button>

            <button
              type="button"
              className={`assignment-manage-modal__confirm${
                isDelete
                  ? " is-delete"
                  : ""
              }`}
              disabled={
                isProcessing
              }
              onClick={
                onConfirm
              }
            >
              {isProcessing
                ? processingLabel
                : content.confirmLabel}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default AssignmentManageModal;