import {
  forwardRef,
  memo,
  useImperativeHandle,
  useRef,
} from "react";

const DrawingCursor = memo(
  forwardRef(function DrawingCursor(
    _props,
    ref,
  ) {
    const elementRef =
      useRef(null);

    useImperativeHandle(
      ref,
      () => ({
        show({
          x,
          y,
          size,
          borderColor,
          background,
          borderWidth = 0,
        }) {
          const element =
            elementRef.current;

          if (!element) {
            return;
          }

          element.style.visibility =
            "visible";

          element.style.left =
            `${x}px`;

          element.style.top =
            `${y}px`;

          element.style.width =
            `${size}px`;

          element.style.height =
            `${size}px`;

          element.style.borderWidth =
            `${borderWidth}px`;

          element.style.borderStyle =
            borderWidth > 0
              ? "solid"
              : "none";

          element.style.borderColor =
            borderColor ??
            "transparent";

          element.style.background =
            background ??
            "transparent";
        },

        hide() {
          const element =
            elementRef.current;

          if (!element) {
            return;
          }

          element.style.visibility =
            "hidden";
        },
      }),
      [],
    );

    return (
      <div
        ref={elementRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          visibility: "hidden",
          boxSizing: "border-box",
          border: "0 solid transparent",
          borderRadius: "50%",
          background: "transparent",
          transform:
            "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 8,
        }}
      />
    );
  }),
);

export default DrawingCursor;