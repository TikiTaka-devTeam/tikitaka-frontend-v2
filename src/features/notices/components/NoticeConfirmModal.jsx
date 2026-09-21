import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import noticeWriteIcon from "../../../assets/icons/notice-write.svg";

function NoticeConfirmModal({
  type = "confirm",
  mode = "create",
  isOpen,
  isSaving = false,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) {
    return null;
  }

  const isSuccess = type === "success";
  const isEdit = mode === "edit";

  let title = "작성하시겠습니까?";
  let description = "새로운 공지사항을 추가합니다";

  if (isEdit) {
    title = "수정하시겠습니까?";
    description = "해당 내용으로 공지사항을 수정합니다";
  }

  if (isSuccess) {
    title = isEdit ? "수정되었습니다" : "저장되었습니다";
    description = isEdit
      ? "공지사항을 수정했습니다"
      : "새로운 공지사항을 추가했습니다";
  }

  return (
    <div className="notice-modal-backdrop">
      <section
        className="compact-modal notice-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notice-modal-title"
      >
        <div className="notice-modal__content">
          <div className="notice-modal__icon">
            <img
              src={isSuccess ? confirmCheckIcon : noticeWriteIcon}
              alt=""
              className={
                isSuccess
                  ? "notice-modal__success-icon"
                  : "notice-modal__write-icon"
              }
            />
          </div>

          <div className="notice-modal__text">
            <h2 id="notice-modal-title">{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        {isSuccess ? (
          <button
            type="button"
            className="notice-modal__single-button"
            onClick={onConfirm}
          >
            확인
          </button>
        ) : (
          <div className="notice-modal__actions">
            <button
              type="button"
              className="notice-modal__cancel"
              disabled={isSaving}
              onClick={onCancel}
            >
              취소
            </button>

            <button
              type="button"
              className="notice-modal__confirm"
              disabled={isSaving}
              onClick={onConfirm}
            >
              {isSaving ? "저장 중" : "저장"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default NoticeConfirmModal;
