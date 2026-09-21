import { apiClient } from "../../../lib/api/client.js";

export async function createDocumentRevision(
  documentId,
) {
  const response = await apiClient.post(
    `/documents/${documentId}/revisions`,
  );

  return {
    ...response.data,
    __httpStatus: response.status,
  };
}

export async function uploadRevisionSourcePdf(
  documentId,
  revisionId,
  file,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(
    `/documents/${documentId}/revisions/${revisionId}/source-pdf`,
    formData,
  );

  return response.data;
}

export async function getDocumentRevision(
  documentId,
  revisionId,
) {
  const response = await apiClient.get(
    `/documents/${documentId}/revisions/${revisionId}`,
  );

  return response.data;
}

export async function createRevisionOperation(
  documentId,
  revisionId,
  payload,
) {
  const response = await apiClient.post(
    `/documents/${documentId}/revisions/${revisionId}/operations`,
    payload,
  );

  return response.data;
}

export async function undoRevision(
  documentId,
  revisionId,
  basePreviewVersion,
) {
  const response = await apiClient.post(
    `/documents/${documentId}/revisions/${revisionId}/undo`,
    { base_preview_version: basePreviewVersion },
  );

  return response.data;
}

export async function redoRevision(
  documentId,
  revisionId,
  basePreviewVersion,
) {
  const response = await apiClient.post(
    `/documents/${documentId}/revisions/${revisionId}/redo`,
    { base_preview_version: basePreviewVersion },
  );

  return response.data;
}

export async function completeRevision(
  documentId,
  revisionId,
  basePreviewVersion,
  title,
) {
  const response = await apiClient.post(
    `/documents/${documentId}/revisions/${revisionId}/complete`,
    {
      base_preview_version: basePreviewVersion,
      title,
    },
  );

  return response.data;
}

export async function cancelRevision(
  documentId,
  revisionId,
) {
  const response = await apiClient.delete(
    `/documents/${documentId}/revisions/${revisionId}`,
  );

  return response.data;
}
