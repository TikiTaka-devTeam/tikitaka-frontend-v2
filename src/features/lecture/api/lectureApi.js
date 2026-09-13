import { apiClient } from "../../../lib/api/client.js";

export async function getSpaceDocuments(spaceId) {
  const response = await apiClient.get(
    `/spaces/${spaceId}/documents`,
  );

  return response.data;
}

export async function getDocumentSlides(documentId) {
  const response = await apiClient.get(
    `/documents/${documentId}/slides`,
  );

  return response.data;
}

export async function getDocumentDownloadUrl(documentId) {
  const response = await apiClient.get(
    `/documents/${documentId}/download`,
  );

  return response.data;
}
