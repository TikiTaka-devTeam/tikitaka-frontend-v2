import { apiClient } from "../../../lib/api/client.js";

export async function getSpaceMembers(spaceId, config = {}) {
  const response = await apiClient.get(`/spaces/${spaceId}/members`, config);
  return response.data;
}

export async function getSpaceMemberDetail(spaceId, memberId, config = {}) {
  const response = await apiClient.get(
    `/spaces/${spaceId}/members/${memberId}`,
    config,
  );
  return response.data;
}

export async function deleteSpaceMember(spaceId, memberId) {
  await apiClient.delete(`/spaces/${spaceId}/members/${memberId}`);
}

export async function getSpaceMemberPermissions(spaceId, memberId, config = {}) {
  const response = await apiClient.get(
    `/spaces/${spaceId}/members/${memberId}/permissions`,
    config,
  );
  return response.data;
}

export async function updateSpaceMemberRolePermissions(
  spaceId,
  memberId,
  payload,
) {
  const response = await apiClient.put(
    `/spaces/${spaceId}/members/${memberId}/role-permissions`,
    payload,
  );
  return response.data;
}

export async function getSpaceJoinRequests(spaceId, config = {}) {
  const response = await apiClient.get(
    `/spaces/${spaceId}/join-requests`,
    config,
  );
  return response.data;
}

export async function approveSpaceJoinRequests(spaceId, joinRequestIds) {
  const response = await apiClient.patch(
    `/spaces/${spaceId}/join-requests/approve`,
    { join_request_ids: joinRequestIds },
  );
  return response.data;
}

export async function denySpaceJoinRequests(spaceId, joinRequestIds) {
  const response = await apiClient.patch(
    `/spaces/${spaceId}/join-requests/deny`,
    { join_request_ids: joinRequestIds },
  );
  return response.data;
}

export async function getSpaceInviteCode(spaceId, config = {}) {
  const response = await apiClient.get(
    `/spaces/${spaceId}/invite-code`,
    config,
  );
  return response.data;
}

export async function updateSpaceJoinSettings(spaceId, autoApprove) {
  const response = await apiClient.patch(`/spaces/${spaceId}/join-settings`, {
    auto_approve: autoApprove,
  });
  return response.data;
}
