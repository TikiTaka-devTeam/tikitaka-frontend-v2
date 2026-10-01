import { getSpaces } from "../../spaces/api/spacesApi.js";
import { getDocuments } from "../../spaces/api/documentsApi.js";

function findSpaceName(response, spaceId) {
  const spaces = Array.isArray(response)
    ? response
    : Array.isArray(response?.spaces)
      ? response.spaces
      : [];
  const space = spaces.find(
    (item) => (item.space_id ?? item.id) === spaceId,
  );

  return space?.space_name ?? space?.name ?? "";
}

export async function resolveNotificationSpaceName(notification) {
  if (notification.spaceName) return notification.spaceName;
  if (!notification.spaceId) return "";

  const activeSpaces = await getSpaces("ACTIVE");
  const activeSpaceName = findSpaceName(activeSpaces, notification.spaceId);
  if (activeSpaceName) return activeSpaceName;

  const archivedSpaces = await getSpaces("ARCHIVED");
  return findSpaceName(archivedSpaces, notification.spaceId);
}

export async function resolveNotificationDocumentTitle(notification) {
  if (
    notification.type !== "DOCUMENT_UPLOADED" ||
    !notification.spaceId ||
    !notification.targetId
  ) {
    return "";
  }

  const response = await getDocuments(notification.spaceId);
  const documents = Array.isArray(response)
    ? response
    : response?.documents ?? [];
  const document = documents.find(
    (item) =>
      String(item.document_id ?? item.documentId ?? item.id) ===
      String(notification.targetId),
  );

  return document?.title ?? "";
}

function readUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    return String(
      user?.account_type ?? user?.accountType ?? user?.role ?? "",
    ).toUpperCase();
  } catch {
    return "";
  }
}

export function getNotificationDestination(notification) {
  if (!notification.spaceId) return "/dashboard";

  const spacePath = `/spaces/${encodeURIComponent(notification.spaceId)}`;
  const targetId = notification.targetId
    ? encodeURIComponent(notification.targetId)
    : "";

  switch (notification.type) {
    case "QUESTION_CREATED":
    case "QUESTION_ANSWERED":
      return `${spacePath}/questions${targetId ? `?questionId=${targetId}` : ""}`;
    case "NOTICE_CREATED":
      return `${spacePath}/notices${targetId ? `?noticeId=${targetId}` : ""}`;
    case "DOCUMENT_UPLOADED": {
      if (!targetId) return spacePath;
      const viewerRole = readUserRole() === "PROFESSOR" ? "professor" : "student";
      return `${spacePath}/documents/${targetId}/lecture/${viewerRole}`;
    }
    case "ASSIGNMENT_CLOSED": {
      const assignmentPath =
        readUserRole() === "PROFESSOR"
          ? `${spacePath}/assignments/professor`
          : `${spacePath}/assignments`;
      return `${assignmentPath}${targetId ? `?assignmentId=${targetId}` : ""}`;
    }
    case "SPACE_JOIN_REQUESTED":
      return `${spacePath}/members${targetId ? `?joinRequestId=${targetId}` : ""}`;
    default:
      return spacePath;
  }
}
