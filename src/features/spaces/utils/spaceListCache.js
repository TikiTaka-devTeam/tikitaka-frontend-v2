const spaceListCache = new Map();

function getCacheKey(status) {
  const accessToken = localStorage.getItem("tikitaka_access_token") ?? "";
  return `${accessToken}:${status}`;
}

export function getSpaceListCache(status = "ACTIVE") {
  return spaceListCache.get(getCacheKey(status)) ?? null;
}

export function setSpaceListCache(data, status = "ACTIVE") {
  spaceListCache.set(getCacheKey(status), data);
}
