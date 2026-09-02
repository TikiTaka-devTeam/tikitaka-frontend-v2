import { useEffect, useRef, useState } from "react";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../notifications/api/notifications.api.js";
import {
  COURSES,
  NOTIFICATIONS as MOCK_NOTIFICATIONS,
} from "../data/dashboard.js";

const NOTIFICATION_GROUPS = ["오늘", "어제", "이전"];

function isToday(value) {
  const date = new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getCourseColor(spaceId) {
  return COURSES.find((course) => course.spaceId === spaceId)?.color || "blue";
}

function formatCreatedAt(value) {
  if (!value) return "시간 정보 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeNotification(notification) {
  return {
    id: notification.notification_id,
    group: isToday(notification.created_at) ? "오늘" : "이전",
    color: getCourseColor(notification.space_id),
    title: notification.message,
    meta: formatCreatedAt(notification.created_at),
    isRead: notification.is_read,
  };
}

function NotificationPanel({ onClose }) {
  const panelRef = useRef(null);
  const [notifications, setNotifications] = useState(() =>
    MOCK_NOTIFICATIONS.map((notification) => ({
      ...notification,
      isMock: true,
      isRead: false,
    })),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    panelRef.current?.focus();
    let isMounted = true;

    getNotifications()
      .then(({ data }) => {
        if (!isMounted) return;
        const items = Array.isArray(data) ? data : [];
        setNotifications(items.map(normalizeNotification));
        setErrorMessage("");
      })
      .catch(() => {
        if (isMounted)
          setErrorMessage("알림을 불러오지 못해 목업 데이터를 표시합니다.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      isMounted = false;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const markAsRead = async (notificationId) => {
    const previousNotifications = notifications;
    const notification = notifications.find(
      (item) => item.id === notificationId,
    );
    setNotifications((items) =>
      items.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
    );

    if (notification?.isMock) return;

    try {
      await markNotificationAsRead(notificationId);
    } catch {
      setNotifications(previousNotifications);
      setErrorMessage("알림 읽음 처리에 실패했습니다.");
    }
  };

  const markAllAsRead = async () => {
    const previousNotifications = notifications;
    setNotifications((items) =>
      items.map((item) => ({ ...item, isRead: true })),
    );

    if (notifications.every((notification) => notification.isMock)) return;

    try {
      await markAllNotificationsAsRead();
    } catch {
      setNotifications(previousNotifications);
      setErrorMessage("전체 읽음 처리에 실패했습니다.");
    }
  };

  return (
    <section
      className="dashboard-notifications"
      aria-labelledby="dashboard-notifications-title"
      ref={panelRef}
      tabIndex={-1}
    >
      <header className="dashboard-notifications__header">
        <h2 id="dashboard-notifications-title">알림</h2>
        <button type="button" aria-label="알림 닫기" onClick={onClose}>
          ×
        </button>
        <p>SPACE 알림을 한눈에 확인하세요</p>
      </header>

      <div className="dashboard-notifications__list">
        {isLoading ? (
          <p className="dashboard-notifications__status">
            알림을 불러오는 중입니다.
          </p>
        ) : null}
        {errorMessage ? (
          <p className="dashboard-notifications__status" role="status">
            {errorMessage}
          </p>
        ) : null}
        {!isLoading && notifications.length === 0 ? (
          <p className="dashboard-notifications__status">
            새로운 알림이 없습니다.
          </p>
        ) : null}
        {NOTIFICATION_GROUPS.map((group) => {
          const groupedNotifications = notifications.filter(
            (notification) => notification.group === group,
          );
          if (groupedNotifications.length === 0) return null;

          return (
            <section
              className="dashboard-notifications__group"
              aria-labelledby={`notification-group-${group}`}
              key={group}
            >
              <h3 id={`notification-group-${group}`}>{group}</h3>
              <ul>
                {groupedNotifications.map((notification) => (
                  <li
                    className={notification.isRead ? "is-read" : ""}
                    key={notification.id}
                  >
                    <button
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <span
                        className={`dashboard-notification__dot dashboard-notification__dot--${notification.color}`}
                        aria-hidden="true"
                      />
                      <span className="dashboard-notification__content">
                        <strong>{notification.title}</strong>
                        <small>{notification.meta}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <footer>
        <span>알림은 최근 30일 동안 보관돼요</span>
        <button type="button" onClick={markAllAsRead}>
          모두 읽음
        </button>
      </footer>
    </section>
  );
}

export default NotificationPanel;
