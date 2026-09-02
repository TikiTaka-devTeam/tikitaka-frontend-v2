import "./modalActions.css";

function ModalActions({
  onCancel,
  onConfirm,
  cancelText = "취소",
  confirmText = "저장",
  confirmType = "button",
  confirmDisabled = false,
  showCancel = true,
  className = "",
}) {
  return (
    <div className={`modal-actions ${className}`}>
      {showCancel && (
        <button
          type="button"
          className="modal-actions__button modal-actions__cancel"
          onClick={onCancel}
        >
          {cancelText}
        </button>
      )}

      <button
        type={confirmType}
        className="modal-actions__button modal-actions__confirm"
        onClick={onConfirm}
        disabled={confirmDisabled}
      >
        {confirmText}
      </button>
    </div>
  );
}

export default ModalActions;
