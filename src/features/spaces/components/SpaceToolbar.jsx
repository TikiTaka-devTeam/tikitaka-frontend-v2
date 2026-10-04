import assignmentIcon from "../../../assets/icons/space/space-assignment.svg";
import lectureIcon from "../../../assets/icons/space/space-lecture.svg";
import memberIcon from "../../../assets/icons/space/space-member.svg";
import noticeIcon from "../../../assets/icons/space/space-notice.svg";
import questionIcon from "../../../assets/icons/space/space-question.svg";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSpaceMemberPermissions, getSpaceMembers } from "../../members/api/membersApi.js";

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

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem("tikitaka_user") || "null") || {}; } catch { return {}; }
}

function isCurrentSpaceMember(member, user) {
  const memberId = String(member?.member_id ?? member?.id ?? "");
  const userIds = [user?.member_id, user?.memberId, user?.space_member_id, user?.spaceMemberId, user?.user_id, user?.userId, user?.id].filter(Boolean).map(String);
  const memberNumber = String(member?.student_number ?? member?.studentNumber ?? "");
  const userNumber = String(user?.member_id_number ?? user?.memberIdNumber ?? user?.student_number ?? user?.studentNumber ?? "");
  return Boolean((memberId && userIds.includes(memberId)) || (memberNumber && userNumber && memberNumber === userNumber));
}

function SpaceToolbar({
  activeItem = "lecture",
  spaceId,
  spaceName,
  onNavigate,
  transitioning = false,
}) {
  const navigate = useNavigate();

  const selectedItem = activeItem;

  const [isNavigating, setIsNavigating] =
    useState(false);

  const isProfessor =
    readUserRole() === "PROFESSOR";

  const handleNavigation = async (itemId) => {
    if (
      !spaceId ||
      isNavigating || transitioning ||
      itemId === selectedItem
    ) {
      return;
    }

    setIsNavigating(true);
    let assignmentManager = isProfessor;
    if (itemId === "assignment" && !isProfessor) {
      try {
        const memberResponse = await getSpaceMembers(spaceId);
        const member = (memberResponse?.members ?? []).find((item) => isCurrentSpaceMember(item, readStoredUser()));
        const memberId = member?.member_id ?? member?.id;
        if (String(member?.role ?? "").toUpperCase() === "ASSISTANT" && memberId) {
          const permissionResponse = await getSpaceMemberPermissions(spaceId, memberId);
          assignmentManager = Array.isArray(permissionResponse?.permissions) && permissionResponse.permissions.includes("ASSIGNMENT_MANAGE");
        }
      } catch {
        assignmentManager = false;
      }
    }

    const destinations = {
      lecture: `/spaces/${spaceId}`,
      notice: `/spaces/${spaceId}/notices`,
      assignment: assignmentManager
        ? `/spaces/${spaceId}/assignments/professor`
        : `/spaces/${spaceId}/assignments`,
      question: `/spaces/${spaceId}/questions`,
      member: `/spaces/${spaceId}/members`,
    };

    if (destinations[itemId]) {
      (onNavigate ?? navigate)(destinations[itemId], { state: { spaceName } });
    }
    setIsNavigating(false);
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
              disabled={isNavigating || transitioning}
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
