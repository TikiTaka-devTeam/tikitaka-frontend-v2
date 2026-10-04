export const ARCHIVED_SPACE_MESSAGE = "보관된 Space입니다. 조회와 다운로드만 가능합니다.";

export function findSpaceAccess(spaceId, activeData, archivedData) {
  const matches = (space) => String(space.space_id ?? space.spaceId ?? space.id) === String(spaceId);
  const archived = (archivedData?.spaces ?? []).find(matches);
  const active = (activeData?.spaces ?? []).find(matches);
  if (archived) return { status: "ARCHIVED", name: archived.space_name ?? archived.name };
  if (active && active.status === "ACTIVE") return { status: "ACTIVE", name: active.space_name ?? active.name };
  throw new Error("Space 상태를 확인할 수 없습니다. 목록에서 참여 상태를 확인해주세요.");
}

export function isSpaceMutation(config, spaceId) {
  const method = String(config.method ?? "get").toLowerCase();
  if (["get", "head", "options"].includes(method)) return false;
  const path = String(config.url ?? "").split("?")[0].replace(/^https?:\/\/[^/]+/, "").replace(/^\/api\/v1/, "");
  // Restoring the current Space is the sole permitted Space mutation.
  if (method === "patch" && path === `/spaces/${spaceId}/restore`) return false;
  return /^\/(spaces|documents|slides|questions|answers|comments|assignments|submissions|notices|announcements|fixers|categories|members)(\/|$)/.test(path);
}
