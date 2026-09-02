import { apiClient } from "../../../lib/api/client.js";

export const getNotifications = () => apiClient.get("/notifications");

export const markNotificationAsRead = (notificationId) =>
  apiClient.patch(`/notifications/${notificationId}/read`);

export const markAllNotificationsAsRead = () =>
  apiClient.patch("/notifications/read-all");
