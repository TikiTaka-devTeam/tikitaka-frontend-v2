import { createPortal } from "react-dom";

import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import deleteIcon from "../../../assets/icons/delete.svg";
import DownloadIcon from "../../../assets/icons/download2.svg?react";

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

  grade: {
    confirm: {
      title:
        "성적을 최종 저장하시겠습니까?",
      description:
        "최종 저장 시, 등록된 성적이 공개됩니다.",
      confirmLabel: "저장",
    },

    success: {
      title: "저장되었습니다",
      description:
        "등록된 성적이 공개되었습니다.",
      confirmLabel: "확인",
    },
  },

  download: {
    confirm: {
      title:
        "모든 제출물을 다운로드하시겠습니까?",
      description:
        "학생들의 제출물을 모두 저장합니다",
      confirmLabel: "저장",
    },

    success: {
      title: "저장되었습니다",
      description:
        "다운로드 폴더를 열어 확인해주세요",
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

  const isDownload =
    action === "download";

  const processingLabel =
    isDelete
      ? "삭제 중"
      : isDownload
        ? "다운로드 중"
        : "저장 중";

  const modalContent = (
    <>
      <style>
        {`
          .assignment-manage-modal__download-svg {
            display: block;
            width: 24px;
            height: 24px;
          }

          .assignment-manage-modal__download-svg path,
          .assignment-manage-modal__download-svg line,
          .assignment-manage-modal__download-svg polyline {
            stroke: #5B5CE2 !important;
          }

          .assignment-manage-modal__download-svg path[fill]:not([fill="none"]),
          .assignment-manage-modal__download-svg rect[fill]:not([fill="none"]),
          .assignment-manage-modal__download-svg circle[fill]:not([fill="none"]) {
            fill: #5B5CE2 !important;
          }
        `}
      </style>

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
              {isDownload &&
              !isSuccess ? (
                <DownloadIcon
                  className="assignment-manage-modal__download-svg"
                  aria-hidden="true"
                />
              ) : (
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
              )}
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
                {content.description}
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
                onClick={onConfirm}
              >
                {content.confirmLabel}
              </button>
            </div>
          ) : (
            <div className="assignment-manage-modal__actions">
              <button
                type="button"
                className="assignment-manage-modal__cancel"
                disabled={isProcessing}
                onClick={onCancel}
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
                disabled={isProcessing}
                onClick={onConfirm}
              >
                {isProcessing
                  ? processingLabel
                  : content.confirmLabel}
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );

  return createPortal(
    modalContent,
    document.body,
  );
}

export default AssignmentManageModal;