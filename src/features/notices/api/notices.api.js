import { apiClient } from "../../../lib/api/client.js";

export const getSystemNotices = () => apiClient.get("/system-notices");

export const getSystemNotice = (systemNoticeId, config = {}) =>
  apiClient.get(`/system-notices/${systemNoticeId}`, config);
