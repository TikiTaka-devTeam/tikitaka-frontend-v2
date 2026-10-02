import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { markNotificationAsRead } from "../api/notifications.api.js";
import {
  getNotificationDestination,
  resolveNotificationDocumentTitle,
  resolveNotificationLectureRole,
  resolveNotificationSpaceName,
} from "../utils/notificationNavigation.js";
import "../styles/notificationRedirect.css";

const pendingRedirectRequests = new Map();

function resolveNotificationRedirectOnce(notification) {
  const requestKey = [
    notification.id,
    notification.type,
    notification.spaceId,
    notification.targetId,
  ].join(":");

  if (pendingRedirectRequests.has(requestKey)) {
    return pendingRedirectRequests.get(requestKey);
  }

  const readRequest = notification.id
    ? markNotificationAsRead(notification.id).catch(() => null)
    : Promise.resolve();
  const request = Promise.all([
    readRequest,
    resolveNotificationSpaceName(notification).catch(() => ""),
    resolveNotificationDocumentTitle(notification).catch(() => ""),
    resolveNotificationLectureRole(notification),
  ])
    .then(([, spaceName, documentTitle, lectureRole]) => ({
      spaceName,
      documentTitle,
      lectureRole,
    }))
    .finally(() => {
      pendingRedirectRequests.delete(requestKey);
    });

  pendingRedirectRequests.set(requestKey, request);
  return request;
}

function NotificationRedirectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("알림 내용을 확인하고 있습니다.");

  useEffect(() => {
    let isMounted = true;
    const accessToken = localStorage.getItem("tikitaka_access_token");

    if (!accessToken) {
      sessionStorage.setItem(
        "tikitaka_notification_redirect",
        `${window.location.pathname}${window.location.search}`,
      );
      navigate("/login", { replace: true });
      return undefined;
    }

    const notification = {
      id: searchParams.get("notificationId") || "",
      type: searchParams.get("type") || "",
      spaceId: searchParams.get("spaceId") || "",
      targetId: searchParams.get("targetId") || "",
    };

    const redirect = async () => {
      const { spaceName, documentTitle, lectureRole } =
        await resolveNotificationRedirectOnce(notification);

      if (!isMounted) return;

      navigate(getNotificationDestination(notification, lectureRole), {
        replace: true,
        state:
          spaceName || documentTitle
            ? { spaceName, documentTitle }
            : undefined,
      });
    };

    redirect().catch(() => {
      if (isMounted) {
        setMessage("알림 화면으로 이동하지 못했습니다.");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <main className="notification-redirect-page">
      <p role="status">{message}</p>
    </main>
  );
}

export default NotificationRedirectPage;
