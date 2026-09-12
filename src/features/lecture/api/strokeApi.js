import { apiClient } from "../../../lib/api/client.js";

export async function getPrivateStrokes(slideId) {
  const response = await apiClient.get(
    `/api/v1/slides/${slideId}/private-strokes`,
  );

  return response.data;
}

export async function syncPrivateStrokes(
  slideId,
  payload,
) {
  const response = await apiClient.post(
    `/api/v1/slides/${slideId}/private-strokes/sync`,
    payload,
  );

  return response.data;
}

export async function getSharedStrokes(slideId) {
  const response = await apiClient.get(
    `/api/v1/slides/${slideId}/shared-strokes`,
  );

  return response.data;
}

export async function syncSharedStrokes(
  slideId,
  payload,
) {
  const response = await apiClient.post(
    `/api/v1/slides/${slideId}/shared-strokes/sync`,
    payload,
  );

  return response.data;
}

export async function createFixer(
  slideId,
  payload,
) {
  const response = await apiClient.post(
    `/api/v1/slides/${slideId}/fixers`,
    payload,
  );

  return response.data;
}

export async function getFixers(slideId) {
  const response = await apiClient.get(
    `/api/v1/slides/${slideId}/fixers`,
  );

  return response.data;
}

export async function checkFixer(fixerId) {
  const response = await apiClient.patch(
    `/api/v1/fixers/${fixerId}/check`,
  );

  return response.data;
}
