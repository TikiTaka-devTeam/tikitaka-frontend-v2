import { apiClient } from "../../../lib/api/client.js";

export async function getDocuments(spaceId, config = {}) {
  const response = await apiClient.get(`/spaces/${spaceId}/documents`, config);
  return response.data;
}

export async function uploadDocument(spaceId, { title, file }) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);

  const response = await apiClient.post(
    `/spaces/${spaceId}/documents`,
    formData,
  );

  return response.data;
}

export async function deleteDocument(documentId) {
  await apiClient.delete(`/documents/${documentId}`);
}
