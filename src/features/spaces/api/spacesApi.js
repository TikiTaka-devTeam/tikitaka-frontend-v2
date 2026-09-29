import { apiClient } from "../../../lib/api/client.js";

export async function getSpaces(status = "ACTIVE", config = {}) {
  const response = await apiClient.get("/spaces", {
    ...config,
    params: {
      ...config.params,
      status,
    },
  });

  return response.data;
}

export async function createSpace(spaceData) {
  const response = await apiClient.post("/spaces", spaceData);

  return response.data;
}

export async function updateSpace(spaceId, spaceData) {
  const response = await apiClient.patch(`/spaces/${spaceId}`, spaceData);

  return response.data;
}

export async function archiveSpace(spaceId) {
  const response = await apiClient.patch(`/spaces/${spaceId}/archive`);

  return response.data;
}

export async function restoreSpace(spaceId) {
  const response = await apiClient.patch(`/spaces/${spaceId}/restore`);

  return response.data;
}

export async function deleteSpace(spaceId) {
  await apiClient.delete(`/spaces/${spaceId}`);
}

export async function joinSpace(spaceCode) {
  const response = await apiClient.post("/spaces/join", {
    space_code: spaceCode,
  });

  return response.data;
}
