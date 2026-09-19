import { apiClient } from "../../../lib/api/client.js";

export async function getSpaceAssignments(
  spaceId,
  config = {},
) {
  const response = await apiClient.get(
    `/spaces/${spaceId}/assignments`,
    config,
  );

  return response.data;
}

export async function getAssignmentSummary(
  spaceId,
  config = {},
) {
  const response = await apiClient.get(
    `/spaces/${spaceId}/assignments/summary`,
    config,
  );

  return response.data;
}

export async function getAssignmentDetail(
  assignmentId,
  config = {},
) {
  const response = await apiClient.get(
    `/assignments/${assignmentId}`,
    config,
  );

  return response.data;
}

export async function submitAssignment(
  assignmentId,
  {
    comment = "",
    files = [],
  },
  config = {},
) {
  const formData = new FormData();

  formData.append("comment", comment);

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await apiClient.post(
    `/assignments/${assignmentId}/submissions`,
    formData,
    config,
  );

  return response.data;
}

export async function updateMyAssignmentSubmission(
  assignmentId,
  {
    comment = "",
    files = [],
  },
  config = {},
) {
  const formData = new FormData();

  formData.append("comment", comment);

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await apiClient.put(
    `/assignments/${assignmentId}/submissions/me`,
    formData,
    config,
  );

  return response.data;
}

export async function closeAssignment(
  assignmentId,
  config = {},
) {
  const response = await apiClient.patch(
    `/assignments/${assignmentId}/close`,
    null,
    config,
  );

  return response.data;
}