import ConfirmCheckIcon from "../../../assets/icons/confirm-check.svg?react";
import deleteIcon from "../../../assets/icons/delete.svg";

function NoticeDeleteModal({
  type = "confirm",
  isOpen,
  isDeleting = false,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) {
    return null;
  }

  const isSuccess =
    type === "success";

  return (
    <div className="notice-delete-modal-backdrop">
      <section
        className="compact-modal notice-delete-modal"
        role={
          isSuccess
            ? "dialog"
            : "alertdialog"
        }
        aria-modal="true"
        aria-labelledby="notice-delete-modal-title"
        aria-describedby="notice-delete-modal-description"
      >
        <div className="notice-delete-modal__content">
          <div
            className="notice-delete-modal__icon"
            aria-hidden="true"
          >
            {isSuccess ? (
              <ConfirmCheckIcon className="notice-delete-modal__success-icon" />
            ) : (
              <img
                src={deleteIcon}
                alt=""
                className="notice-delete-modal__delete-icon"
              />
            )}
          </div>

          <div className="notice-delete-modal__text">
            <h2 id="notice-delete-modal-title">
              {isSuccess
                ? "삭제되었습니다"
                : "삭제하시겠습니까?"}
            </h2>

            <p
              id="notice-delete-modal-description"
              className={
                isSuccess
                  ? "is-success"
                  : ""
              }
            >
              삭제한 공지사항은 다시 복구할 수 없습니다
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="notice-delete-modal__actions">
            <button
              type="button"
              className="notice-delete-modal__confirm"
              onClick={onConfirm}
            >
              확인
            </button>
          </div>
        ) : (
          <div className="notice-delete-modal__actions">
            <button
              type="button"
              className="notice-delete-modal__cancel"
              disabled={isDeleting}
              onClick={onCancel}
            >
              취소
            </button>

            <button
              type="button"
              className="notice-delete-modal__delete"
              disabled={isDeleting}
              onClick={onConfirm}
            >
              {isDeleting
                ? "삭제 중"
                : "삭제"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default NoticeDeleteModal;
