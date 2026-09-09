import { apiClient } from "../../../lib/api/client.js";

export async function createDocumentRevision(
  documentId,
) {
  const response = await apiClient.post(
    `/api/v1/documents/${documentId}/revisions`,
  );

  return response.data;
}

export async function uploadRevisionSourcePdf(
  documentId,
  revisionId,
  file,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(
    `/api/v1/documents/${documentId}/revisions/${revisionId}/source-pdf`,
    formData,
  );

  return response.data;
}

export async function getDocumentRevision(
  documentId,
  revisionId,
) {
  const response = await apiClient.get(
    `/api/v1/documents/${documentId}/revisions/${revisionId}`,
  );

  return response.data;
}

export async function createRevisionOperation(
  documentId,
  revisionId,
  payload,
) {
  const response = await apiClient.post(
    `/api/v1/documents/${documentId}/revisions/${revisionId}/operations`,
    payload,
  );

  return response.data;
}

export async function undoRevision(
  documentId,
  revisionId,
) {
  const response = await apiClient.post(
    `/api/v1/documents/${documentId}/revisions/${revisionId}/undo`,
  );

  return response.data;
}

export async function redoRevision(
  documentId,
  revisionId,
) {
  const response = await apiClient.post(
    `/api/v1/documents/${documentId}/revisions/${revisionId}/redo`,
  );

  return response.data;
}

export async function completeRevision(
  documentId,
  revisionId,
) {
  const response = await apiClient.post(
    `/api/v1/documents/${documentId}/revisions/${revisionId}/complete`,
  );

  return response.data;
}

export async function cancelRevision(
  documentId,
  revisionId,
) {
  const response = await apiClient.delete(
    `/api/v1/documents/${documentId}/revisions/${revisionId}`,
  );

  return response.data;
}
