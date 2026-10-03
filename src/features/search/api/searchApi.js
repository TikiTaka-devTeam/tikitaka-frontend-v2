import { apiClient } from "../../../lib/api/client.js";

export async function searchAll(keyword, config = {}) {
  const response = await apiClient.get("/search", {
    ...config,
    params: { ...config.params, keyword },
  });
  return response.data;
}

export async function saveRecentSearch(keyword) {
  await apiClient.post("/search/recent", { keyword });
}

export async function getRecentSearches(config = {}) {
  const response = await apiClient.get("/search/recent", config);
  return response.data;
}

export async function deleteRecentSearch(searchId) {
  const response = await apiClient.delete(`/search/recent/${searchId}`);
  return response.data;
}

export async function deleteAllRecentSearches() {
  const response = await apiClient.delete("/search/recent");
  return response.data;
}

export async function getRecentSearchItems(config = {}) {
  const response = await apiClient.get("/search/recent-items", config);
  return response.data;
}
