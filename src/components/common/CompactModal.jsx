import ModalBackdrop from "./ModalBackdrop.jsx";
import "./compactModal.css";

function CompactModal({
  children,
  onClose,
  labelledBy,
  describedBy,
  className = "",
  backdropClassName = "",
}) {
  return (
    <ModalBackdrop onClose={onClose} className={backdropClassName}>
      <section
        className={`compact-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      >
        {children}
      </section>
    </ModalBackdrop>
  );
}

export default CompactModal;
