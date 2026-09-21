import assignmentIcon from "../../../assets/icons/space/space-assignment.svg";
import lectureIcon from "../../../assets/icons/space/space-lecture.svg";
import memberIcon from "../../../assets/icons/space/space-member.svg";
import noticeIcon from "../../../assets/icons/space/space-notice.svg";
import questionIcon from "../../../assets/icons/space/space-question.svg";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/spaceToolbar.css";

const SPACE_TOOLBAR_ITEMS = [
  {
    id: "lecture",
    label: "강의자료",
    icon: lectureIcon,
  },
  {
    id: "notice",
    label: "공지사항",
    icon: noticeIcon,
  },
  {
    id: "question",
    label: "질문",
    icon: questionIcon,
  },
  {
    id: "assignment",
    label: "과제",
    icon: assignmentIcon,
  },
  {
    id: "member",
    label: "멤버",
    icon: memberIcon,
  },
];

function readUserRole() {
  try {
    const user = JSON.parse(
      localStorage.getItem("tikitaka_user") || "null",
    );

    const role =
      user?.account_type ??
      user?.accountType ??
      user?.role ??
      user?.user?.account_type ??
      user?.user?.accountType ??
      user?.user?.role ??
      localStorage.getItem("tikitaka_account_type") ??
      localStorage.getItem("account_type") ??
      localStorage.getItem("role") ??
      "";

    return String(role).toUpperCase();
  } catch {
    return "";
  }
}

function SpaceToolbar({
  activeItem = "lecture",
  spaceId,
  spaceName,
}) {
  const navigate = useNavigate();

  const [selectedItem, setSelectedItem] =
    useState(activeItem);

  const [isNavigating, setIsNavigating] =
    useState(false);

  const isProfessor =
    readUserRole() === "PROFESSOR";

  const handleNavigation = (itemId) => {
    if (
      !spaceId ||
      isNavigating ||
      itemId === selectedItem
    ) {
      return;
    }

    const destinations = {
      lecture: `/spaces/${spaceId}`,
      notice: `/spaces/${spaceId}/notices`,
      assignment: isProfessor
        ? `/spaces/${spaceId}/assignments/professor`
        : `/spaces/${spaceId}/assignments`,
      member: `/spaces/${spaceId}/members`,
    };

    if (destinations[itemId]) {
      setSelectedItem(itemId);
      setIsNavigating(true);

      window.setTimeout(() => {
        navigate(destinations[itemId], {
          state: {
            spaceName,
          },
        });
      }, 260);
    }
  };

  const activeIndex = Math.max(
    0,
    SPACE_TOOLBAR_ITEMS.findIndex(
      (item) =>
        item.id === selectedItem,
    ),
  );

  return (
    <nav
      className="space-toolbar"
      aria-label="Space 메뉴"
    >
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        style={{
          position: "absolute",
        }}
      >
        <defs>
          <filter id="space-toolbar-icon-inactive">
            <feColorMatrix
              in="SourceGraphic"
              type="luminanceToAlpha"
              result="luminance"
            />

            <feComponentTransfer
              in="luminance"
              result="darkPixels"
            >
              <feFuncA
                type="table"
                tableValues="1 1 1 1 0"
              />
            </feComponentTransfer>

            <feComposite
              in="darkPixels"
              in2="SourceAlpha"
              operator="in"
              result="shape"
            />

            <feFlood
              floodColor="#131A29"
              result="color"
            />

            <feComposite
              in="color"
              in2="shape"
              operator="in"
            />
          </filter>

          <filter id="space-toolbar-icon-active">
            <feColorMatrix
              in="SourceGraphic"
              type="luminanceToAlpha"
              result="luminance"
            />

            <feComponentTransfer
              in="luminance"
              result="darkPixels"
            >
              <feFuncA
                type="table"
                tableValues="1 1 1 1 0"
              />
            </feComponentTransfer>

            <feComposite
              in="darkPixels"
              in2="SourceAlpha"
              operator="in"
              result="shape"
            />

            <feFlood
              floodColor="#2E6BFF"
              result="color"
            />

            <feComposite
              in="color"
              in2="shape"
              operator="in"
            />
          </filter>
        </defs>
      </svg>

      <span
        className={`space-toolbar__active-indicator space-toolbar__active-indicator--${activeIndex}`}
        aria-hidden="true"
      />

      {SPACE_TOOLBAR_ITEMS.map(
        (item) => {
          const isActive =
            item.id === selectedItem;

          return (
            <button
              key={item.id}
              type="button"
              className={`space-toolbar__item ${
                isActive
                  ? "space-toolbar__item--active"
                  : ""
              }`}
              aria-current={
                isActive
                  ? "page"
                  : undefined
              }
              disabled={isNavigating}
              onClick={() =>
                handleNavigation(
                  item.id,
                )
              }
            >
              <img
                src={item.icon}
                alt=""
                style={{
                  filter: isActive
                    ? "url(#space-toolbar-icon-active)"
                    : "url(#space-toolbar-icon-inactive)",
                }}
              />

              <span>
                {item.label}
              </span>
            </button>
          );
        },
      )}
    </nav>
  );
}

export default SpaceToolbar;