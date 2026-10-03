import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import searchIcon from "../../assets/icons/dashboard-search.svg";
import notificationIcon from "../../assets/icons/dashboard-notification.svg";

import homeIcon from "../../assets/icons/dashboard-home.svg";
import homeBlackIcon from "../../assets/icons/dashboard-home-black.svg";

import spacesIcon from "../../assets/icons/dashboard-spaces.svg";
import spacesBlackIcon from "../../assets/icons/dashboard-spaces-black.svg";

import NotificationPanel from "../../features/dashboard/components/NotificationPanel.jsx";
import { getNotifications } from "../../features/notifications/api/notifications.api.js";
import ProfileActionModal from "../../features/dashboard/components/ProfileActionModal.jsx";
import ProfileMenu from "../../features/dashboard/components/ProfileMenu.jsx";
import { getProfileInitial } from "../../utils/profileInitial.js";
import "./appToolbars.css";

const DEFAULT_NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    activeIcon: homeIcon,
    inactiveIcon: homeBlackIcon,
  },
  {
    label: "Spaces",
    path: "/spaces",
    activeIcon: spacesIcon,
    inactiveIcon: spacesBlackIcon,
  },
];

function readProfileImage() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");

    return (
      user?.profile_url ||
      user?.profileUrl ||
      user?.profile_image_url ||
      user?.profileImageUrl ||
      ""
    );
  } catch {
    return "";
  }
}

function readProfileName() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    return user?.name || user?.user_name || user?.username || "";
  } catch {
    return "";
  }
}

export function UtilityToolbar({
  onSearch,
  onNotifications,
  onProfile,
  profilePath = "/profile-setting",
  profileImage,
  profileName,
  hasUnreadNotifications = false,
}) {
  const navigate = useNavigate();

  const resolvedProfileImage = profileImage ?? readProfileImage();
  const resolvedProfileName = profileName ?? readProfileName();

  return (
    <nav className="dashboard-utility" aria-label="빠른 메뉴">
      <button type="button" aria-label="통합 검색" onClick={onSearch}>
        <img src={searchIcon} alt="" />
      </button>

      <button
        className="dashboard-utility__notification"
        type="button"
        aria-label="알림"
        onClick={onNotifications}
      >
        <img src={notificationIcon} alt="" />
        {hasUnreadNotifications && (
          <span
            className="lecture-toolbar__question-notification"
            aria-hidden="true"
          />
        )}
      </button>

      <button
        type="button"
        aria-label="내 정보"
        onClick={onProfile || (() => navigate(profilePath))}
      >
        {resolvedProfileImage ? (
          <img
            className="dashboard-utility__profile"
            src={resolvedProfileImage}
            alt=""
          />
        ) : (
          <span className="dashboard-utility__profile" aria-hidden="true">
            {getProfileInitial(resolvedProfileName)}
          </span>
        )}
      </button>
    </nav>
  );
}

export function SearchToolbar({ value, onChange, onSubmit }) {
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.();
  }

  return (
    <form
      className="dashboard-search-toolbar"
      role="search"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="global-search">
        통합 검색
      </label>

      <input
        id="global-search"
        name="query"
        type="search"
        placeholder="Space, 강의자료, 공지사항, 질문 검색"
        value={value}
        onChange={onChange}
        autoFocus
      />

      <button type="submit" aria-label="검색">
        <img src={searchIcon} alt="" />
      </button>
    </form>
  );
}

export function BottomNavigation({ items = DEFAULT_NAV_ITEMS }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="dashboard-bottom-nav" aria-label="주요 메뉴">
      {items.map(({ label, path, icon, activeIcon, inactiveIcon }) => {
        const isDashboardRoot =
          path === "/dashboard" && location.pathname === "/";

        const isActive =
          isDashboardRoot ||
          location.pathname === path ||
          location.pathname.startsWith(`${path}/`);

        const resolvedIcon = isActive
          ? (activeIcon ?? icon)
          : (inactiveIcon ?? icon);

        return (
          <button
            key={path}
            type="button"
            className={isActive ? "is-active" : undefined}
            aria-current={isActive ? "page" : undefined}
            onClick={() => navigate(path)}
          >
            <img src={resolvedIcon} alt="" />

            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function AppToolbars({
  items,
  onNotifications,
  onProfile,
  showBottomNavigation = true,
  ...utilityProps
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileAction, setProfileAction] = useState(null);
  const [profileImage, setProfileImage] = useState(undefined);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getNotifications()
      .then(({ data }) => {
        if (!isMounted) return;

        const notifications = Array.isArray(data?.notifications)
          ? data.notifications
          : [];
        setHasUnreadNotifications(
          notifications.some((notification) => !notification.is_read),
        );
      })
      .catch(() => {
        if (isMounted) setHasUnreadNotifications(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNotifications = () => {
    setIsProfileMenuOpen(false);
    setIsNotificationsOpen((isOpen) => !isOpen);
    onNotifications?.();
  };

  const handleProfile = () => {
    setIsNotificationsOpen(false);
    setIsProfileMenuOpen((isOpen) => !isOpen);
    onProfile?.();
  };

  return (
    <>
      <UtilityToolbar
        {...utilityProps}
        onNotifications={handleNotifications}
        onProfile={handleProfile}
        profileImage={profileImage}
        hasUnreadNotifications={hasUnreadNotifications}
      />
      {isNotificationsOpen ? (
        <NotificationPanel
          onClose={() => setIsNotificationsOpen(false)}
          onUnreadChange={setHasUnreadNotifications}
        />
      ) : null}
      {isProfileMenuOpen ? (
        <ProfileMenu
          onSelect={(action) => {
            setIsProfileMenuOpen(false);
            setProfileAction(action);
          }}
        />
      ) : null}
      {profileAction ? (
        <ProfileActionModal
          action={profileAction}
          onClose={() => setProfileAction(null)}
          onProfileUpdated={setProfileImage}
        />
      ) : null}
      {showBottomNavigation ? <BottomNavigation items={items} /> : null}
    </>
  );
}
