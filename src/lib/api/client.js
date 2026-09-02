import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
});

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

export default apiClient;
