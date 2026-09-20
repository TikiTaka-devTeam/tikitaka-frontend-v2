import { apiClient } from "../../../lib/api/client.js";

function createJsonPart(data) {
  return new Blob(
    [JSON.stringify(data)],
    {
      type: "application/json",
    },
  );
}

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

export async function createAssignment(
  spaceId,
  {
    title,
    description,
    dueAt,
    closeType,
    files = [],
  },
  config = {},
) {
  const formData =
    new FormData();

  formData.append(
    "assignment_data",
    createJsonPart({
      title,
      description,
      due_at: dueAt,
      close_type: closeType,
    }),
  );

  files.forEach((file) => {
    formData.append(
      "files",
      file,
    );
  });

  const response =
    await apiClient.post(
      `/spaces/${spaceId}/assignments`,
      formData,
      config,
    );

  return response.data;
}

export async function updateAssignment(
  assignmentId,
  {
    title,
    description,
    dueAt,
    closeType,
    retainedFileIds,
    newFiles = [],
  },
  config = {},
) {
  const assignmentData = {
    title,
    description,
    due_at: dueAt,
    close_type: closeType,
  };

  if (
    Array.isArray(
      retainedFileIds,
    )
  ) {
    assignmentData.retained_file_ids =
      retainedFileIds;
  }

  const formData =
    new FormData();

  formData.append(
    "assignment_data",
    createJsonPart(
      assignmentData,
    ),
  );

  newFiles.forEach(
    (file) => {
      formData.append(
        "new_files",
        file,
      );
    },
  );

  const response =
    await apiClient.patch(
      `/assignments/${assignmentId}`,
      formData,
      config,
    );

  return response.data;
}

export async function closeAssignment(
  assignmentId,
  config = {},
) {
  const response =
    await apiClient.patch(
      `/assignments/${assignmentId}/close`,
      null,
      config,
    );

  return response.data;
}

export async function deleteAssignment(
  assignmentId,
  config = {},
) {
  const response =
    await apiClient.delete(
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
  const formData =
    new FormData();

  formData.append(
    "comment",
    comment,
  );

  files.forEach((file) => {
    formData.append(
      "files",
      file,
    );
  });

  const response =
    await apiClient.post(
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
  const formData =
    new FormData();

  formData.append(
    "comment",
    comment,
  );

  files.forEach((file) => {
    formData.append(
      "files",
      file,
    );
  });

  const response =
    await apiClient.put(
      `/assignments/${assignmentId}/submissions/me`,
      formData,
      config,
    );

  return response.data;
}

export async function getAssignmentSubmissions(
  assignmentId,
  config = {},
) {
  const response =
    await apiClient.get(
      `/assignments/${assignmentId}/submissions`,
      config,
    );

  return response.data;
}

export async function getAssignmentSubmissionsDownload(
  assignmentId,
  config = {},
) {
  const response =
    await apiClient.get(
      `/assignments/${assignmentId}/submissions/download`,
      config,
    );

  return response.data;
}

export async function updateAssignmentMaxScore(
  assignmentId,
  maxScore,
  config = {},
) {
  const response =
    await apiClient.patch(
      `/assignments/${assignmentId}/max-score`,
      {
        max_score: maxScore,
      },
      config,
    );

  return response.data;
}

export async function saveAssignmentGrades(
  assignmentId,
  grades,
  config = {},
) {
  const response =
    await apiClient.put(
      `/assignments/${assignmentId}/grades`,
      {
        grades,
      },
      config,
    );

  return response.data;
}

export async function finalizeAssignmentGrades(
  assignmentId,
  config = {},
) {
  const response =
    await apiClient.post(
      `/assignments/${assignmentId}/grades/finalize`,
      null,
      config,
    );

  return response.data;
}

export async function updateStudentAssignmentGrade(
  assignmentId,
  studentId,
  score,
  config = {},
) {
  const response =
    await apiClient.patch(
      `/assignments/${assignmentId}/grades/${studentId}`,
      {
        score,
      },
      config,
    );

  return response.data;
}