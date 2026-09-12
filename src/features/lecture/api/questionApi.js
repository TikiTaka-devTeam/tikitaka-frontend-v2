import { apiClient } from "../../../lib/api/client.js";

export async function getDocumentQuestions(
  documentId,
  params = {},
) {
  const response = await apiClient.get(
    `/api/v1/documents/${documentId}/questions`,
    {
      params,
    },
  );

  return response.data;
}

export async function getQuestionDetail(questionId) {
  const response = await apiClient.get(
    `/api/v1/questions/${questionId}`,
  );

  return response.data;
}

export async function createSlideQuestion(
  slideId,
  payload,
) {
  const response = await apiClient.post(
    `/api/v1/slides/${slideId}/questions`,
    payload,
  );

  return response.data;
}

export async function getSimilarQuestions(
  spaceId,
  payload,
) {
  const response = await apiClient.post(
    `/api/v1/spaces/${spaceId}/questions/similar`,
    payload,
  );

  return response.data;
}

export async function createAnswer(
  questionId,
  payload,
) {
  const response = await apiClient.post(
    `/api/v1/questions/${questionId}/answers`,
    payload,
  );

  return response.data;
}

export async function updateAnswer(
  answerId,
  payload,
) {
  const response = await apiClient.patch(
    `/api/v1/answers/${answerId}`,
    payload,
  );

  return response.data;
}

export async function deleteAnswer(answerId) {
  const response = await apiClient.delete(
    `/api/v1/answers/${answerId}`,
  );

  return response.data;
}

export async function likeQuestion(questionId) {
  const response = await apiClient.post(
    `/api/v1/questions/${questionId}/likes`,
  );

  return response.data;
}

export async function unlikeQuestion(questionId) {
  const response = await apiClient.delete(
    `/api/v1/questions/${questionId}/likes`,
  );

  return response.data;
}
