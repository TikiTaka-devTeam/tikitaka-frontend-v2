import { useContext } from "react";
import { ModalCloseTransitionContext } from "./ModalCloseTransitionContext.js";
import { closeWithModalTransition } from "./modalTransition.js";
import "./modalActions.css";

function ModalActions({
  onCancel,
  onConfirm,
  cancelText = "취소",
  confirmText = "저장",
  confirmType = "button",
  confirmDisabled = false,
  cancelDisabled = false,
  showCancel = true,
  className = "",
}) {
  const requestModalClose = useContext(ModalCloseTransitionContext);
  const runModalClose = (callback, event) => {
    if (requestModalClose) {
      requestModalClose(() => callback?.(event));
      return;
    }
    closeWithModalTransition(event, callback);
  };
  const handleCancel = (event) => runModalClose(onCancel, event);
  const handleConfirm = (event) => {
    if (confirmType !== "submit" && onConfirm) {
      runModalClose(onConfirm, event);
      return;
    }
    onConfirm?.(event);
  };

  return (
    <div className={`modal-actions${showCancel ? "" : " modal-actions--single"} ${className}`}>
      {showCancel && (
        <button
          type="button"
          className="modal-actions__button modal-actions__cancel"
          onClick={handleCancel}
          disabled={cancelDisabled}
        >
          {cancelText}
        </button>
      )}

      <button
        type={confirmType}
        className="modal-actions__button modal-actions__confirm"
        onClick={handleConfirm}
        disabled={confirmDisabled}
      >
        {confirmText}
      </button>
    </div>
  );
}

export default ModalActions;
