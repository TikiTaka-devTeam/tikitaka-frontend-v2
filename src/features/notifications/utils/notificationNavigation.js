import { getSpaces } from "../../spaces/api/spacesApi.js";
import { getDocuments } from "../../spaces/api/documentsApi.js";
import {
  getSpaceMemberPermissions,
  getSpaceMembers,
} from "../../members/api/membersApi.js";

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
      user?.account_type ??
      user?.accountType ??
      user?.role ??
      user?.user?.account_type ??
      user?.user?.accountType ??
      user?.user?.role ??
      localStorage.getItem("tikitaka_account_type") ??
      localStorage.getItem("account_type") ??
      localStorage.getItem("role") ??
      "",
    ).toUpperCase();
  } catch {
    return "";
  }
}

export async function resolveNotificationLectureRole(notification) {
  if (notification.type !== "DOCUMENT_UPLOADED" || !notification.spaceId) {
    return "STUDENT";
  }
  const fallbackRole = readUserRole() === "PROFESSOR" ? "PROFESSOR" : "STUDENT";
  const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
  const account = { ...user, ...user?.user };
  const userIds = [
    account?.member_id,
    account?.memberId,
    account?.space_member_id,
    account?.spaceMemberId,
    account?.user_id,
    account?.userId,
    account?.id,
  ].filter(Boolean).map(String);
  const studentNumber = String(
    account?.member_id_number ?? account?.memberIdNumber ??
    account?.student_number ?? account?.studentNumber ?? "",
  );
  if (!userIds.length && !studentNumber) return fallbackRole;

  const memberData = await getSpaceMembers(notification.spaceId);
  const currentMember = (memberData?.members ?? []).find((member) => {
    const memberId = String(member?.member_id ?? member?.id ?? "");
    const memberNumber = String(member?.student_number ?? member?.studentNumber ?? "");
    return (memberId && userIds.includes(memberId)) ||
      (memberNumber && studentNumber && memberNumber === studentNumber);
  });
  if (!currentMember) return fallbackRole;
  const spaceRole = String(currentMember.role ?? "").toUpperCase();
  if (spaceRole === "PROFESSOR") return "PROFESSOR";
  if (spaceRole !== "ASSISTANT") return "STUDENT";

  const memberId = currentMember.member_id ?? currentMember.id;
  const permissionData = await getSpaceMemberPermissions(notification.spaceId, memberId);
  return permissionData?.role === "ASSISTANT" &&
    permissionData?.permissions?.includes("LECTURE_MATERIAL_MANAGE")
    ? "ASSISTANT"
    : "STUDENT";
}

export function getNotificationDestination(notification, lectureRole) {
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
      const viewerRole = lectureRole ??
        (readUserRole() === "PROFESSOR" ? "PROFESSOR" : "STUDENT");
      const rolePath = ["PROFESSOR", "ASSISTANT"].includes(viewerRole)
        ? viewerRole.toLowerCase()
        : "student";
      return `${spacePath}/documents/${targetId}/lecture/${rolePath}`;
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
