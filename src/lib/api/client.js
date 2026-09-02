import axios from "axios";

const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";

const normalizedBaseUrl =
  configuredBaseUrl.replace(/\/$/, "");

const API_BASE_URL =
  normalizedBaseUrl.endsWith("/api/v1")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

let refreshRequest = null;

apiClient.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config;
  }

  const accessToken = localStorage.getItem("tikitaka_access_token");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest =
      error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?.skipAuth ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    const refreshToken =
      localStorage.getItem(
        "tikitaka_refresh_token",
      );

    if (!refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = axios
          .post(
            `${API_BASE_URL}/auth/token/refresh`,
            {
              refresh_token:
                refreshToken,
            },
          )
          .then(({ data }) => {
            const accessToken =
              data?.access_token;

            if (!accessToken) {
              throw new Error(
                "Access Token 재발급 응답이 올바르지 않습니다.",
              );
            }

            localStorage.setItem(
              "tikitaka_access_token",
              accessToken,
            );

            if (
              data?.refresh_token
            ) {
              localStorage.setItem(
                "tikitaka_refresh_token",
                data.refresh_token,
              );
            }

            return accessToken;
          })
          .finally(() => {
            refreshRequest = null;
          });
      }

      const accessToken =
        await refreshRequest;

      originalRequest.headers.Authorization =
        `Bearer ${accessToken}`;

      return apiClient(
        originalRequest,
      );
    } catch (refreshError) {
      localStorage.removeItem(
        "tikitaka_access_token",
      );
      localStorage.removeItem(
        "tikitaka_refresh_token",
      );
      localStorage.removeItem(
        "tikitaka_user",
      );

      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.replace(
          "/login",
        );
      }

      return Promise.reject(
        refreshError,
      );
    }
  },
);

export default apiClient;
