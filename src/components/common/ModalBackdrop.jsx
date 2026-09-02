import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./modalBackdrop.css";

function ModalBackdrop({
  children,
  onClose,
  closeOnBackdrop = false,
  closeOnEscape = true,
  className = "",
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (closeOnEscape && event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOnEscape, onClose]);

  const handleBackdropMouseDown = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return createPortal(
    <div
      className={`modal-backdrop ${className}`}
      onMouseDown={handleBackdropMouseDown}
    >
      {children}
    </div>,
    document.body,
  );
}

export default ModalBackdrop;
