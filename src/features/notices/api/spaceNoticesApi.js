import { apiClient } from "../../../lib/api/client.js";

export async function getSpaceNotices(spaceId, config = {}) {
  const response = await apiClient.get(
    `/spaces/${spaceId}/notices`,
    config,
  );

  return response.data;
}

export async function getSpaceNoticeDetail(noticeId, config = {}) {
  const response = await apiClient.get(
    `/notices/${noticeId}`,
    config,
  );

  return response.data;
}