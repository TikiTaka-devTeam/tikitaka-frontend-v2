import { apiClient } from "../../../lib/api/client.js";

export async function getDocumentQuestions(
  documentId,
  params = {},
) {
  const response = await apiClient.get(
    `/documents/${documentId}/questions`,
    {
      params,
    },
  );

  return response.data;
}

export async function getQuestionDetail(questionId) {
  const response = await apiClient.get(
    `/questions/${questionId}`,
  );

  return response.data;
}

export async function deleteQuestion(questionId) {
  const response = await apiClient.delete(
    `/questions/${questionId}`,
  );

  return response.data;
}

export async function createSlideQuestion(
  slideId,
  payload,
) {
  const response = await apiClient.post(
    `/slides/${slideId}/questions`,
    payload,
  );

  return response.data;
}

export async function getSimilarQuestions(questionId) {
  const response = await apiClient.post(
    `/questions/${questionId}/similar`,
  );

  return response.data;
}

export async function createAnswer(
  questionId,
  payload,
) {
  const response = await apiClient.post(
    `/questions/${questionId}/answers`,
    payload,
  );

  return response.data;
}

export async function updateAnswer(
  answerId,
  payload,
) {
  const response = await apiClient.patch(
    `/answers/${answerId}`,
    payload,
  );

  return response.data;
}

export async function deleteAnswer(answerId) {
  const response = await apiClient.delete(
    `/answers/${answerId}`,
  );

  return response.data;
}

export async function createQuestionComment(
  questionId,
  payload,
) {
  const response = await apiClient.post(
    `/questions/${questionId}/comments`,
    payload,
  );

  return response.data;
}

export async function likeQuestion(questionId) {
  const response = await apiClient.post(
    `/questions/${questionId}/likes`,
  );

  return response.data;
}

export async function unlikeQuestion(questionId) {
  const response = await apiClient.delete(
    `/questions/${questionId}/likes`,
  );

  return response.data;
}
