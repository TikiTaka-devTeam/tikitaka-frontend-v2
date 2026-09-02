import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "";

function getAccessToken() {
  return localStorage.getItem(
    "tikitaka_access_token",
  );
}

function getAuthConfig() {
  const accessToken =
    getAccessToken();

  return {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {},
  };
}

export async function getSpaces(
  status = "ACTIVE",
) {
  const response =
    await axios.get(
      `${API_BASE_URL}/api/v1/spaces`,
      {
        params: {
          status,
        },
        ...getAuthConfig(),
      },
    );

  return response.data;
}

export async function createSpace(
  spaceData,
) {
  const response =
    await axios.post(
      `${API_BASE_URL}/api/v1/spaces`,
      spaceData,
      getAuthConfig(),
    );

  return response.data;
}

export async function updateSpace(
  spaceId,
  spaceData,
) {
  const response =
    await axios.patch(
      `${API_BASE_URL}/api/v1/spaces/${spaceId}`,
      spaceData,
      getAuthConfig(),
    );

  return response.data;
}

export async function archiveSpace(
  spaceId,
) {
  const response =
    await axios.patch(
      `${API_BASE_URL}/api/v1/spaces/${spaceId}/archive`,
      null,
      getAuthConfig(),
    );

  return response.data;
}

export async function restoreSpace(
  spaceId,
) {
  const response =
    await axios.patch(
      `${API_BASE_URL}/api/v1/spaces/${spaceId}/restore`,
      null,
      getAuthConfig(),
    );

  return response.data;
}

export async function deleteSpace(
  spaceId,
) {
  await axios.delete(
    `${API_BASE_URL}/api/v1/spaces/${spaceId}`,
    getAuthConfig(),
  );
}

export async function joinSpace(
  spaceCode,
) {
  const response =
    await axios.post(
      `${API_BASE_URL}/api/v1/spaces/join`,
      {
        space_code: spaceCode,
      },
      getAuthConfig(),
    );

  return response.data;
}