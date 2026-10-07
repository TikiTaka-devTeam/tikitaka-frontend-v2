import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import "./modalBackdrop.css";

import { ModalCloseTransitionContext } from "./ModalCloseTransitionContext.js";

function wrapCloseButtons(nodes, onClose, requestClose) {
  return Children.map(nodes, (node) => {
    if (!isValidElement(node)) return node;

    const isButton = typeof node.type === "string" && node.type === "button";
    const label = `${node.props["aria-label"] ?? ""} ${node.props.className ?? ""} ${typeof node.props.children === "string" ? node.props.children : ""}`;
    const isDismissControl = /취소|닫기/.test(label) || /close|cancel/i.test(label);
    const originalClick = node.props.onClick;
    const shouldDelayClose = isButton
      && (originalClick === onClose || isDismissControl)
      && typeof originalClick === "function";

    return cloneElement(node, {
      ...(shouldDelayClose
        ? {
            onClick: (event) => {
              event.preventDefault();
              requestClose(() => originalClick(event));
            },
          }
        : {}),
      children: wrapCloseButtons(node.props.children, onClose, requestClose),
    });
  });
}

function ModalCloseButtons({ children, onClose, requestClose }) {
  return wrapCloseButtons(children, onClose, requestClose);
}

function ModalBackdrop({
  children,
  onClose,
  closeOnBackdrop = false,
  closeOnEscape = true,
  className = "",
}) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);

  const requestClose = useCallback((callback) => {
    if (typeof callback !== "function" || closeTimerRef.current !== null) {
      return;
    }

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      callback();
    }, 160);
  }, []);



  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (closeOnEscape && event.key === "Escape") {
        requestClose(onClose);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [closeOnEscape, onClose, requestClose]);

  const handleBackdropMouseDown = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      requestClose(onClose);
    }
  };

  return createPortal(
    <div
      className={`modal-backdrop ${className}${isClosing ? " is-closing" : ""}`}
      onMouseDown={handleBackdropMouseDown}
    >
      <ModalCloseTransitionContext.Provider value={requestClose}>
        <ModalCloseButtons onClose={onClose} requestClose={requestClose}>
          {children}
        </ModalCloseButtons>
      </ModalCloseTransitionContext.Provider>
    </div>,
    document.body,
  );
}

export default ModalBackdrop;
