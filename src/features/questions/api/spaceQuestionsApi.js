import { apiClient } from "../../../lib/api/client.js";

export async function getSpaceQuestions(spaceId, params, config = {}) {
  const response = await apiClient.get(`/spaces/${spaceId}/questions`, { ...config, params });
  return response.data;
}

export async function getMySpaceQuestions(spaceId, params, config = {}) {
  const response = await apiClient.get(`/spaces/${spaceId}/questions/mine`, { ...config, params });
  return response.data;
}

export async function getMyQuestionSummary(spaceId, config = {}) {
  const response = await apiClient.get(`/spaces/${spaceId}/questions/my-summary`, config);
  return response.data;
}

export async function getSpaceQuestionCategories(spaceId, config = {}) {
  const response = await apiClient.get(`/spaces/${spaceId}/question-categories`, config);
  if (!Array.isArray(response.data?.documents)) {
    throw new Error("Invalid question categories response");
  }
  return response.data;
}

export async function exportSpaceQuestions(spaceId) {
  const response = await apiClient.get(`/spaces/${spaceId}/questions/export`, {
    params: { format: "csv" },
  });
  return response.data;
}

export async function createSpaceQuestion(spaceId, payload) {
  const response = await apiClient.post(`/spaces/${spaceId}/questions`, payload);
  return response.data;
}

export async function createDocumentQuestionCategory(documentId, name) {
  const response = await apiClient.post(`/documents/${documentId}/categories`, { name });
  return response.data;
}

export async function deleteQuestionCategory(categoryId) {
  const response = await apiClient.delete(`/categories/${categoryId}`);
  return response.data;
}
