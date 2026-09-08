import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import ChevronLeftIcon from "../../../assets/icons/chevron-left.svg?react";
import ChevronRightIcon from "../../../assets/icons/chevron-right.svg?react";

const HIDE_DELAY = 3000;
const REVEAL_HEIGHT = 140;

export default function SlidePagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}) {
  const [visible, setVisible] =
    useState(true);

  const timerRef = useRef(null);

  const showAndScheduleHide =
    useCallback(() => {
      if (timerRef.current) {
        window.clearTimeout(
          timerRef.current,
        );
      }

      setVisible(true);

      timerRef.current =
        window.setTimeout(() => {
          setVisible(false);
        }, HIDE_DELAY);
    }, []);

  useEffect(() => {
    timerRef.current =
      window.setTimeout(() => {
        setVisible(false);
      }, HIDE_DELAY);

    function handlePointer(
      event,
    ) {
      if (
        event.clientY >=
        window.innerHeight -
          REVEAL_HEIGHT
      ) {
        showAndScheduleHide();
      }
    }

    window.addEventListener(
      "pointerdown",
      handlePointer,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "pointermove",
      handlePointer,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        handlePointer,
      );

      window.removeEventListener(
        "pointermove",
        handlePointer,
      );

      if (timerRef.current) {
        window.clearTimeout(
          timerRef.current,
        );
      }
    };
  }, [showAndScheduleHide]);

  function handlePrevious() {
    showAndScheduleHide();
    onPrevious();
  }

  function handleNext() {
    showAndScheduleHide();
    onNext();
  }

  return (
    <nav
      className={`slide-pagination${
        visible
          ? " is-visible"
          : ""
      }`}
      aria-label="강의자료 페이지 이동"
      onPointerEnter={
        showAndScheduleHide
      }
      onPointerDown={
        showAndScheduleHide
      }
    >
      <button
        type="button"
        aria-label="이전 페이지"
        disabled={currentPage <= 1}
        onClick={handlePrevious}
      >
        <ChevronLeftIcon />
      </button>

      <span>
        {currentPage} /{" "}
        {totalPages || "–"}
      </span>

      <button
        type="button"
        aria-label="다음 페이지"
        disabled={
          !totalPages ||
          currentPage >= totalPages
        }
        onClick={handleNext}
      >
        <ChevronRightIcon />
      </button>
    </nav>
  );
}