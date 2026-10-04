import axios from "axios";

const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const normalizedBaseUrl = configuredBaseUrl.replace(/\/$/, "");

const API_BASE_URL = normalizedBaseUrl.endsWith("/api/v1")
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

let refreshRequest = null;

function getTokenExpiration(accessToken) {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;

    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const decodedPayload = atob(
      normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "="),
    );
    const expirationSeconds = JSON.parse(decodedPayload)?.exp;

    return Number.isFinite(expirationSeconds) ? expirationSeconds * 1000 : null;
  } catch {
    return null;
  }
}

function refreshAccessToken() {
  if (!refreshRequest) {
    const refreshToken = localStorage.getItem("tikitaka_refresh_token");
    if (!refreshToken) return Promise.reject(new Error("Refresh token is missing."));

    refreshRequest = axios
      .post(`${API_BASE_URL}/auth/token/refresh`, {
        refresh_token: refreshToken,
      })
      .then(({ data }) => {
        const accessToken = data?.access_token;

        if (!accessToken) {
          throw new Error("Access Token 재발급 응답이 올바르지 않습니다.");
        }

        localStorage.setItem("tikitaka_access_token", accessToken);

        if (data?.refresh_token) {
          localStorage.setItem("tikitaka_refresh_token", data.refresh_token);
        }

        return accessToken;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

function clearAuthenticationAndRedirect() {
  localStorage.removeItem("tikitaka_access_token");
  localStorage.removeItem("tikitaka_refresh_token");
  localStorage.removeItem("tikitaka_user");

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

apiClient.interceptors.request.use(async (config) => {
  if (config.skipAuth) {
    return config;
  }

  let accessToken = localStorage.getItem("tikitaka_access_token");
  const refreshToken = localStorage.getItem("tikitaka_refresh_token");
  const expiration = accessToken ? getTokenExpiration(accessToken) : null;

  if (
    accessToken &&
    refreshToken &&
    expiration !== null &&
    expiration > Date.now() &&
    expiration - Date.now() <= 2 * 60 * 1000
  ) {
    try {
      accessToken = await refreshAccessToken();
    } catch (error) {
      clearAuthenticationAndRedirect();
      throw error;
    }
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?.skipAuth ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    if (!localStorage.getItem("tikitaka_refresh_token")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken();

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAuthenticationAndRedirect();

      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
