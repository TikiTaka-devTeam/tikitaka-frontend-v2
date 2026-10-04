import ChevronLeftIcon from "../../../assets/icons/chevron-left.svg?react";
import ChevronRightIcon from "../../../assets/icons/chevron-right.svg?react";

export default function SlidePagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}) {
  return (
    <nav
      className="slide-pagination is-visible"
      aria-label="강의자료 페이지 이동"
    >
      <button
        type="button"
        aria-label="이전 페이지"
        disabled={currentPage <= 1}
        onClick={onPrevious}
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
        onClick={onNext}
      >
        <ChevronRightIcon />
      </button>
    </nav>
  );
}
