import { useEffect, useRef, useState } from 'react';

import MoreIcon from '../../../assets/icons/more.svg?react';
import ArchiveIcon from '../../../assets/icons/archive.svg?react';
import PencilEditIcon from '../../../assets/icons/pencil-edit.svg?react';
import ActivityIcon from '../../../assets/icons/activity.svg?react';
import DeleteIcon from '../../../assets/icons/delete.svg?react';

const COURSE_COLORS = {
  BLUE: {
    background: '#EAF0FF',
    accent: '#2E63E9',
  },

  SKY: {
    background: '#E8F4FF',
    accent: '#2776C8',
  },

  CYAN: {
    background: '#E4F7F8',
    accent: '#168A93',
  },

  TEAL: {
    background: '#E5F6F1',
    accent: '#23856E',
  },

  GREEN: {
    background: '#EAF7ED',
    accent: '#3F9653',
  },

  LIME: {
    background: '#F1F7E4',
    accent: '#6F8F2E',
  },

  YELLOW: {
    background: '#FFF6D9',
    accent: '#A57916',
  },

  ORANGE: {
    background: '#FFF0E2',
    accent: '#C66A22',
  },

  RED: {
    background: '#FDE8E8',
    accent: '#D54A4A',
  },

  PINK: {
    background: '#FBE8F4',
    accent: '#C64D91',
  },

  PURPLE: {
    background: '#F1EAFE',
    accent: '#7B57C7',
  },

  INDIGO: {
    background: '#ECECFF',
    accent: '#5B5CC5',
  },
};

function SpaceCard({
  space,
  onArchive,
  onActivate,
  onEdit,
  onDelete,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef(null);

  const colorKey =
    typeof space.color === 'string'
      ? space.color.toUpperCase()
      : 'BLUE';

  const courseColor =
    COURSE_COLORS[colorKey] ?? COURSE_COLORS.BLUE;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      );

      document.removeEventListener(
        'keydown',
        handleEscape,
      );
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

  return (
    <article className="space-card">
      <div
        className="space-card__semester"
        style={{
          backgroundColor: courseColor.background,
          color: courseColor.accent,
        }}
      >
        {space.semester}
      </div>

      <h3 className="space-card__title">
        {space.name}
      </h3>

      <p className="space-card__info">
        {space.professor}

        {space.schedule && (
          <>
            <span className="space-card__divider">
              {' · '}
            </span>

            {space.schedule}
          </>
        )}

        {space.room && (
          <>
            <span className="space-card__divider">
              {' · '}
            </span>

            {space.room}
          </>
        )}
      </p>

      <div
        className="space-card__menu-wrapper"
        ref={menuRef}
      >
        <button
          type="button"
          className={`space-card__more-button ${
            isMenuOpen
              ? 'space-card__more-button--active'
              : ''
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
                  onClick={(event) =>
                    handleAction(event, onArchive)
                  }
                >
                  <ArchiveIcon
                    className="space-menu__icon"
                    aria-hidden="true"
                  />

                  <span>보관됨</span>
                </button>

                <button
                  type="button"
                  className="space-menu__item"
                  onClick={(event) =>
                    handleAction(event, onEdit)
                  }
                >
                  <PencilEditIcon
                    className="space-menu__icon"
                    aria-hidden="true"
                  />

                  <span>수정</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="space-menu__item"
                  onClick={(event) =>
                    handleAction(event, onActivate)
                  }
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
                  onClick={(event) =>
                    handleAction(event, onDelete)
                  }
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
    </article>
  );
}

export default SpaceCard;