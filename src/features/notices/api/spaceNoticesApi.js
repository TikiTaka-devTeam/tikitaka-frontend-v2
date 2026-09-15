import { apiClient } from "../../../lib/api/client.js";

export async function getSpaceNotices(
  spaceId,
  config = {},
) {
  const response = await apiClient.get(
    `/spaces/${spaceId}/notices`,
    config,
  );

  return response.data;
}

export async function getSpaceNoticeDetail(
  noticeId,
  config = {},
) {
  const response = await apiClient.get(
    `/notices/${noticeId}`,
    config,
  );

  return response.data;
}

export async function createSpaceNotice(
  spaceId,
  {
    title,
    content,
    files = [],
  },
  config = {},
) {
  const formData = new FormData();

  formData.append(
    "notice_data",
    new Blob(
      [
        JSON.stringify({
          title,
          content,
        }),
      ],
      {
        type: "application/json",
      },
    ),
  );

  files.forEach((file) => {
    formData.append(
      "files",
      file,
    );
  });

  const response =
    await apiClient.post(
      `/spaces/${spaceId}/notices`,
      formData,
      config,
    );

  return response.data;
}

export async function updateSpaceNotice(
  noticeId,
  {
    title,
    content,
    retainedFileIds,
    newFiles = [],
  },
  config = {},
) {
  const formData = new FormData();

  const noticeData = {
    title,
    content,
  };

  if (
    retainedFileIds !==
    undefined
  ) {
    noticeData.retained_file_ids =
      retainedFileIds;
  }

  formData.append(
    "notice_data",
    new Blob(
      [
        JSON.stringify(
          noticeData,
        ),
      ],
      {
        type: "application/json",
      },
    ),
  );

  newFiles.forEach((file) => {
    formData.append(
      "new_files",
      file,
    );
  });

  const response =
    await apiClient.patch(
      `/notices/${noticeId}`,
      formData,
      config,
    );

  return response.data;
}

export async function deleteSpaceNotice(
  noticeId,
  config = {},
) {
  const response =
    await apiClient.delete(
      `/notices/${noticeId}`,
      config,
    );

  return response.data;
}