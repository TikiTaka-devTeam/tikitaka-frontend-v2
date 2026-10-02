import { useEffect, useRef, useState } from "react";

import MoreIcon from "../../../assets/icons/more.svg?react";
import ArchiveIcon from "../../../assets/icons/archive.svg?react";
import PencilEditIcon from "../../../assets/icons/pencil-edit.svg?react";
import ActivityIcon from "../../../assets/icons/activity.svg?react";
import DeleteIcon from "../../../assets/icons/delete.svg?react";
import { getSpaceColor } from "../utils/spaceColors.js";

const MENU_LABEL_STYLE = {
  display: "inline-block",
  width: "36px",
  textAlign: "center",
};

const PENDING_BADGE_STYLE = {
  width: "fit-content",
  minWidth: "0",
  padding: "0 7px",
  backgroundColor: "rgba(31, 87, 237, 0.12)",
  color: "#757F94",
};

const ARCHIVED_BADGE_STYLE = {
  backgroundColor: "#EBEEF5",
  color: "#758094",
};

function SpaceCard({
  space,
  canManage = false,
  onArchive,
  onActivate,
  onEdit,
  onDelete,
  onOpen,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef(null);

  const courseColor = getSpaceColor(space.color);

  const isPending =
    space.participationStatus === "PENDING" || space.isPending === true;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleMenu = (event) => {
    event.stopPropagation();

    setIsMenuOpen((prev) => !prev);
  };

  const handleAction = (event, callback) => {
    event.stopPropagation();

    callback?.(space.id);

    setIsMenuOpen(false);
  };

  const handleOpen = () => {
    if (!isPending && onOpen) {
      onOpen?.(space);
    }
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  return (
    <article
      className={`space-card ${
        !isPending && onOpen ? "space-card--openable" : ""
      }`}
      role={!isPending && onOpen ? "link" : undefined}
      tabIndex={!isPending && onOpen ? 0 : undefined}
      onClick={handleOpen}
      onKeyDown={handleCardKeyDown}
    >
      <div
        className="space-card__semester"
        style={
          space.archived
            ? ARCHIVED_BADGE_STYLE
            : isPending
            ? PENDING_BADGE_STYLE
            : {
                backgroundColor: courseColor.background,
                color: courseColor.accent,
              }
        }
      >
        {isPending ? "참여 대기중" : space.semester}
      </div>

      <div className="space-card__title-row">
        <h3 className="space-card__title">{space.name}</h3>

        {space.spaceCode && (
          <span className="space-card__code"># {space.spaceCode}</span>
        )}
      </div>

      <p className="space-card__info">
        {space.professor}

        {space.schedule && (
          <>
            {space.professor && (
              <span className="space-card__divider">{" · "}</span>
            )}

            {space.schedule}
          </>
        )}

        {space.room && (
          <>
            {(space.professor || space.schedule) && (
              <span className="space-card__divider">{" · "}</span>
            )}

            {space.room}
          </>
        )}
      </p>

      {canManage && !isPending && (
        <div className="space-card__menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className={`space-card__more-button ${
              isMenuOpen ? "space-card__more-button--active" : ""
            }`}
            onClick={toggleMenu}
            aria-label="Space 메뉴 열기"
            aria-expanded={isMenuOpen}
          >
            <MoreIcon className="space-card__more-icon" />
          </button>

          {isMenuOpen && (
            <div className="space-menu">
              {!space.archived ? (
                <>
                  <button
                    type="button"
                    className="space-menu__item"
                    onClick={(event) => handleAction(event, onArchive)}
                  >
                    <ArchiveIcon
                      className="space-menu__icon"
                      aria-hidden="true"
                    />

                    <span style={MENU_LABEL_STYLE}>보관됨</span>
                  </button>

                  <button
                    type="button"
                    className="space-menu__item"
                    onClick={(event) => handleAction(event, onEdit)}
                  >
                    <PencilEditIcon
                      className="space-menu__icon"
                      aria-hidden="true"
                    />

                    <span style={MENU_LABEL_STYLE}>수정</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="space-menu__item"
                    onClick={(event) => handleAction(event, onActivate)}
                  >
                    <ActivityIcon
                      className="space-menu__icon"
                      aria-hidden="true"
                    />

                    <span>활성화</span>
                  </button>

                  <button
                    type="button"
                    className="space-menu__item space-menu__item--delete"
                    onClick={(event) => handleAction(event, onDelete)}
                  >
                    <DeleteIcon
                      className="space-menu__icon"
                      aria-hidden="true"
                    />

                    <span>삭제</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default SpaceCard;
