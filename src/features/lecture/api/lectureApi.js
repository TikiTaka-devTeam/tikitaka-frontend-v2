import { apiClient } from "../../../lib/api/client.js";

export async function getSpaceDocuments(spaceId) {
  const response = await apiClient.get(
    `/api/v1/spaces/${spaceId}/documents`,
  );

  return response.data;
}

export async function getDocumentSlides(documentId) {
  const response = await apiClient.get(
    `/api/v1/documents/${documentId}/slides`,
  );

  return response.data;
}

export async function getDocumentDownloadUrl(documentId) {
  const response = await apiClient.get(
    `/api/v1/documents/${documentId}/download`,
  );

  return response.data;
}
