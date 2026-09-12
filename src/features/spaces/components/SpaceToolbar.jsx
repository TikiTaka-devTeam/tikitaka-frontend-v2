import assignmentIcon from "../../../assets/icons/space/space-assignment.svg";
import lectureIcon from "../../../assets/icons/space/space-lecture.svg";
import memberIcon from "../../../assets/icons/space/space-member.svg";
import noticeIcon from "../../../assets/icons/space/space-notice.svg";
import questionIcon from "../../../assets/icons/space/space-question.svg";

import "../styles/spaceToolbar.css";

const SPACE_TOOLBAR_ITEMS = [
  { id: "lecture", label: "강의자료", icon: lectureIcon },
  { id: "notice", label: "공지사항", icon: noticeIcon },
  { id: "question", label: "질문", icon: questionIcon },
  { id: "assignment", label: "과제", icon: assignmentIcon },
  { id: "member", label: "멤버", icon: memberIcon },
];

function SpaceToolbar({ activeItem = "lecture" }) {
  return (
    <nav className="space-toolbar" aria-label="Space 메뉴">
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        style={{ position: "absolute" }}
      >
        <defs>
          <filter id="space-toolbar-icon-inactive">
            <feColorMatrix
              in="SourceGraphic"
              type="luminanceToAlpha"
              result="luminance"
            />

            <feComponentTransfer in="luminance" result="darkPixels">
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

            <feComponentTransfer in="luminance" result="darkPixels">
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

      {SPACE_TOOLBAR_ITEMS.map((item) => {
        const isActive = item.id === activeItem;

        return (
          <button
            key={item.id}
            type="button"
            className={`space-toolbar__item ${
              isActive ? "space-toolbar__item--active" : ""
            }`}
            aria-current={isActive ? "page" : undefined}
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

            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default SpaceToolbar;