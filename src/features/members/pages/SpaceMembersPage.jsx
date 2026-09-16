import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import backIcon from "../../../assets/icons/go-back.svg";
import moreIcon from "../../../assets/icons/more.svg";
import memberBackgroundIcon from "../../../assets/icons/members/Notice-Member-Background.svg";
import assistantSaveIcon from "../../../assets/icons/members/assistant-save.svg";
import graduationCapIcon from "../../../assets/icons/members/graduation-cap.svg";
import joinedDateIcon from "../../../assets/icons/members/member-joined-date.svg";
import mailIcon from "../../../assets/icons/members/member-mail.svg";
import profileAvatar from "../../../assets/images/profile-avatar.svg";
import { AppToolbars } from "../../../components/common/AppToolbars.jsx";
import { getCurrentUser } from "../../auth/api/auth.api.js";
import SpaceToolbar from "../../spaces/components/SpaceToolbar.jsx";
import MemberPermissionModal from "../components/MemberPermissionModal.jsx";
import MemberStatusModal from "../components/MemberStatusModal.jsx";
import {
  approveSpaceJoinRequests,
  deleteSpaceMember,
  getSpaceInviteCode,
  getSpaceJoinRequests,
  getSpaceMemberDetail,
  getSpaceMemberPermissions,
  getSpaceMembers,
  updateSpaceMemberRolePermissions,
  updateSpaceJoinSettings,
} from "../api/membersApi.js";

import "../styles/spaceMembers.css";

function normalizeMember(member) {
  return {
    id: member.member_id ?? member.id ?? "",
    name: member.name ?? "",
    role: member.role ?? "STUDENT",
    studentNumber: member.student_number ?? member.studentNumber ?? "",
    profileUrl: member.profile_url ?? member.profileUrl ?? "",
  };
}

function normalizeMemberDetail(member) {
  if (!member) return null;

  return {
    ...normalizeMember(member),
    university: member.university ?? "",
    email: member.email ?? "",
    major: member.major ?? "",
    joinedAt: member.joined_at ?? member.joinedAt ?? "",
  };
}

function roleLabel(role) {
  return { PROFESSOR: "교수", ASSISTANT: "조교", STUDENT: "학생" }[role] ?? "학생";
}

function normalizeJoinRequest(request) {
  return {
    id: request.join_request_id ?? request.joinRequestId ?? "",
    name: request.name ?? "",
    studentNumber: request.student_number ?? request.studentNumber ?? "",
    profileUrl: request.profile_url ?? request.profileUrl ?? "",
    requestedAt: request.requested_at ?? request.requestedAt ?? "",
  };
}

function readUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    const role =
      user?.account_type ??
      user?.accountType ??
      user?.role ??
      user?.user?.account_type ??
      user?.user?.accountType ??
      user?.user?.role ??
      localStorage.getItem("tikitaka_account_type") ??
      localStorage.getItem("account_type") ??
      localStorage.getItem("role") ??
      "";

    return String(role).toUpperCase();
  } catch {
    return "";
  }
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("tikitaka_user") || "null") || {};
  } catch {
    return {};
  }
}

function isOwnMember(member, user) {
  const memberId = String(member?.id || "");
  const userId = String(
    user?.member_id ??
      user?.memberId ??
      user?.space_member_id ??
      user?.spaceMemberId ??
      user?.user_id ??
      user?.userId ??
      "",
  );
  const studentNumber = String(member?.studentNumber || "");
  const userStudentNumber = String(
    user?.member_id_number ??
      user?.memberIdNumber ??
      user?.student_number ??
      user?.studentNumber ??
      "",
  );

  return Boolean(
    (memberId && userId && memberId === userId) ||
      (studentNumber && userStudentNumber && studentNumber === userStudentNumber),
  );
}

function formatRequestSummary(requests) {
  if (requests.length === 0) return "선택한 학생";
  if (requests.length === 1) return requests[0].name;
  return `${requests[0].name} 외 ${requests.length - 1}명`;
}

function formatMemberSummary(member) {
  return [member?.name, member?.university, member?.major, member?.studentNumber]
    .filter(Boolean)
    .join(" · ");
}

function formatJoinedDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}. ${month}. ${day}`;
}

function SpaceMembersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { spaceId } = useParams();
  const userRole = readUserRole();
  const isProfessor = userRole === "PROFESSOR";
  const isStudent = userRole === "STUDENT";
  const spaceName = location.state?.spaceName || "실무중심산학협력프로젝트1";
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());
  const [members, setMembers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [joinRequests, setJoinRequests] = useState([]);
  const [isJoinRequestsLoading, setIsJoinRequestsLoading] = useState(false);
  const [joinRequestsError, setJoinRequestsError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [selectedJoinRequestIds, setSelectedJoinRequestIds] = useState([]);
  const [isApprovingJoinRequests, setIsApprovingJoinRequests] = useState(false);
  const [isUpdatingAutoApprove, setIsUpdatingAutoApprove] = useState(false);
  const [isInviteCodeCopied, setIsInviteCodeCopied] = useState(false);
  const [approvalModalStep, setApprovalModalStep] = useState(null);
  const [approvalTargets, setApprovalTargets] = useState([]);
  const [approvalError, setApprovalError] = useState("");
  const [kickModalStep, setKickModalStep] = useState(null);
  const [kickTarget, setKickTarget] = useState(null);
  const [kickError, setKickError] = useState("");
  const [isKickingMember, setIsKickingMember] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionRole, setPermissionRole] = useState("STUDENT");
  const [memberPermissions, setMemberPermissions] = useState([]);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);
  const [isPermissionsSaving, setIsPermissionsSaving] = useState(false);
  const [permissionsError, setPermissionsError] = useState("");
  const [permissionSaveModalStep, setPermissionSaveModalStep] = useState(null);
  const [permissionSaveError, setPermissionSaveError] = useState("");
  const [isAssistantPermissionMenuOpen, setIsAssistantPermissionMenuOpen] =
    useState(false);
  const [assistantPermissions, setAssistantPermissions] = useState([]);
  const [isPermissionReadOnly, setIsPermissionReadOnly] = useState(false);

  const currentSpaceMember = members.find((member) =>
    isOwnMember(member, currentUser),
  );
  const currentSpaceMemberId = currentSpaceMember?.id;
  const isCurrentUserAssistant =
    isStudent && currentSpaceMember?.role === "ASSISTANT";
  const canManageMembers =
    isProfessor ||
    (isCurrentUserAssistant && assistantPermissions.includes("MEMBER_MANAGE"));

  useEffect(() => {
    if (!isStudent) return undefined;

    let isActive = true;

    async function loadCurrentUser() {
      try {
        const { data } = await getCurrentUser();
        if (!isActive) return;
        const nextUser = { ...readStoredUser(), ...data };
        setCurrentUser(nextUser);
        localStorage.setItem("tikitaka_user", JSON.stringify(nextUser));
      } catch {
        if (isActive) setCurrentUser(readStoredUser());
      }
    }

    loadCurrentUser();
    return () => {
      isActive = false;
    };
  }, [isStudent]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMembers() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await getSpaceMembers(spaceId, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const list = Array.isArray(response?.members) ? response.members : [];
        setMembers(list.map(normalizeMember));
        setTotalCount(Number(response?.total_count ?? list.length));
      } catch (error) {
        if (error.code !== "ERR_CANCELED") {
          setErrorMessage(error.response?.data?.message || error.response?.data?.detail || "멤버를 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadMembers();
    return () => controller.abort();
  }, [spaceId]);

  useEffect(() => {
    if (!isCurrentUserAssistant || !currentSpaceMemberId) return undefined;

    const controller = new AbortController();

    async function loadAssistantPermissions() {
      try {
        const response = await getSpaceMemberPermissions(
          spaceId,
          currentSpaceMemberId,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setAssistantPermissions(
            Array.isArray(response?.permissions) ? response.permissions : [],
          );
        }
      } catch (error) {
        if (error.code !== "ERR_CANCELED") setAssistantPermissions([]);
      }
    }

    loadAssistantPermissions();
    return () => controller.abort();
  }, [currentSpaceMemberId, isCurrentUserAssistant, spaceId]);

  useEffect(() => {
    if (!canManageMembers) return undefined;

    const controller = new AbortController();

    async function loadMemberManagement() {
      setIsJoinRequestsLoading(true);
      setJoinRequestsError("");
      setSettingsError("");

      const [requestsResult, inviteResult] = await Promise.allSettled([
        getSpaceJoinRequests(spaceId, { signal: controller.signal }),
        getSpaceInviteCode(spaceId, { signal: controller.signal }),
      ]);

      if (controller.signal.aborted) return;

      if (requestsResult.status === "fulfilled") {
        const requests = Array.isArray(requestsResult.value?.join_requests)
          ? requestsResult.value.join_requests
          : [];
        setJoinRequests(requests.map(normalizeJoinRequest));
        setSelectedJoinRequestIds([]);
      } else if (requestsResult.reason?.code !== "ERR_CANCELED") {
        setJoinRequestsError(
          requestsResult.reason?.response?.data?.message ||
            requestsResult.reason?.response?.data?.detail ||
            "승인 대기 목록을 불러오지 못했습니다.",
        );
      }

      if (inviteResult.status === "fulfilled") {
        setInviteCode(inviteResult.value?.invite_code ?? "");
        setAutoApprove(Boolean(inviteResult.value?.auto_approve));
      } else if (inviteResult.reason?.code !== "ERR_CANCELED") {
        setSettingsError(
          inviteResult.reason?.response?.data?.message ||
            inviteResult.reason?.response?.data?.detail ||
            "참여 설정을 불러오지 못했습니다.",
        );
      }

      setIsJoinRequestsLoading(false);
    }

    loadMemberManagement();
    return () => controller.abort();
  }, [canManageMembers, spaceId]);

  async function refreshMembers() {
    const response = await getSpaceMembers(spaceId);
    const list = Array.isArray(response?.members) ? response.members : [];
    setMembers(list.map(normalizeMember));
    setTotalCount(Number(response?.total_count ?? list.length));
  }

  function handleToggleJoinRequest(requestId) {
    setSelectedJoinRequestIds((previous) =>
      previous.includes(requestId)
        ? previous.filter((id) => id !== requestId)
        : [...previous, requestId],
    );
  }

  function handleToggleAllJoinRequests() {
    setSelectedJoinRequestIds((previous) =>
      previous.length === joinRequests.length
        ? []
        : joinRequests.map((request) => request.id),
    );
  }

  function handleOpenApprovalModal() {
    if (selectedJoinRequestIds.length === 0) return;

    setApprovalTargets(
      joinRequests.filter((request) => selectedJoinRequestIds.includes(request.id)),
    );
    setApprovalError("");
    setApprovalModalStep("confirm");
  }

  async function handleConfirmApproval() {
    if (approvalTargets.length === 0 || isApprovingJoinRequests) return;

    const approvedIds = approvalTargets.map((request) => request.id);
    setIsApprovingJoinRequests(true);
    setApprovalError("");

    try {
      await approveSpaceJoinRequests(spaceId, approvedIds);

      setJoinRequests((previous) =>
        previous.filter((request) => !approvedIds.includes(request.id)),
      );
      setSelectedJoinRequestIds([]);

      try {
        await refreshMembers();
      } catch (error) {
        setJoinRequestsError(
          error.response?.data?.message ||
            error.response?.data?.detail ||
            "승인은 완료됐지만 멤버 목록을 갱신하지 못했습니다.",
        );
      }
      setApprovalModalStep("complete");
    } catch (error) {
      setApprovalError(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "선택한 참여 요청을 승인하지 못했습니다.",
      );
    } finally {
      setIsApprovingJoinRequests(false);
    }
  }

  function handleCloseApprovalModal() {
    if (isApprovingJoinRequests) return;
    setApprovalModalStep(null);
    setApprovalTargets([]);
    setApprovalError("");
  }

  async function handleAutoApproveChange() {
    if (isUpdatingAutoApprove) return;

    const previousAutoApprove = autoApprove;
    const nextAutoApprove = !previousAutoApprove;

    setAutoApprove(nextAutoApprove);
    setIsUpdatingAutoApprove(true);
    setSettingsError("");

    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    try {
      const response = await updateSpaceJoinSettings(spaceId, nextAutoApprove);
      setAutoApprove(Boolean(response?.auto_approve ?? nextAutoApprove));
    } catch (error) {
      setAutoApprove(previousAutoApprove);
      setSettingsError(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "자동 승인 설정을 변경하지 못했습니다.",
      );
    } finally {
      setIsUpdatingAutoApprove(false);
    }
  }

  async function handleCopyInviteCode() {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setIsInviteCodeCopied(true);
      window.setTimeout(() => setIsInviteCodeCopied(false), 1500);
    } catch {
      setSettingsError("초대 코드를 복사하지 못했습니다.");
    }
  }

  async function handleSelectMember(member) {
    if (!member.id || isDetailLoading) return;
    const hasStudentDetailRestriction = isStudent && !canManageMembers;
    if (hasStudentDetailRestriction && !isOwnMember(member, currentUser)) return;
    setIsAssistantPermissionMenuOpen(false);
    setSelectedMemberId(member.id);
    setSelectedMember(null);
    setIsDetailLoading(true);
    setErrorMessage("");
    try {
      const response = await getSpaceMemberDetail(spaceId, member.id);
      const memberDetail = normalizeMemberDetail(response);
      setSelectedMember(
        memberDetail
          ? {
              ...memberDetail,
              profileUrl: memberDetail.profileUrl || member.profileUrl,
            }
          : null,
      );
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.response?.data?.detail || "멤버 정보를 불러오지 못했습니다.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleOpenPermissionModal() {
    if (!selectedMember?.id || !isProfessor) return;

    setIsAssistantPermissionMenuOpen(false);
    setIsPermissionReadOnly(false);
    setIsPermissionModalOpen(true);
    setPermissionSaveModalStep(null);
    setIsPermissionsLoading(true);
    setPermissionsError("");
    setPermissionSaveError("");
    setPermissionRole(selectedMember.role === "ASSISTANT" ? "ASSISTANT" : "STUDENT");
    setMemberPermissions([]);

    try {
      const response = await getSpaceMemberPermissions(spaceId, selectedMember.id);
      setPermissionRole("ASSISTANT");
      setMemberPermissions(
        Array.isArray(response?.permissions) ? response.permissions : [],
      );
    } catch (error) {
      setPermissionsError(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "멤버 권한을 불러오지 못했습니다.",
      );
    } finally {
      setIsPermissionsLoading(false);
    }
  }

  async function handleOpenOwnPermissionModal() {
    if (
      !isCurrentUserAssistant ||
      !currentSpaceMemberId ||
      selectedMember?.id !== currentSpaceMemberId
    ) {
      return;
    }

    setIsPermissionReadOnly(true);
    setIsPermissionModalOpen(true);
    setPermissionRole("ASSISTANT");
    setMemberPermissions(assistantPermissions);
    setIsPermissionsLoading(true);
    setPermissionsError("");

    try {
      const response = await getSpaceMemberPermissions(spaceId, currentSpaceMemberId);
      const nextPermissions = Array.isArray(response?.permissions)
        ? response.permissions
        : [];
      setMemberPermissions(nextPermissions);
      setAssistantPermissions(nextPermissions);
    } catch (error) {
      setPermissionsError(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "권한을 불러오지 못했습니다.",
      );
    } finally {
      setIsPermissionsLoading(false);
    }
  }

  function handlePermissionRoleChange(role) {
    setPermissionRole(role);
    if (role === "STUDENT") setMemberPermissions([]);
  }

  function handlePermissionToggle(permission) {
    setMemberPermissions((previous) =>
      previous.includes(permission)
        ? previous.filter((item) => item !== permission)
        : [...previous, permission],
    );
  }

  function handleRequestPermissionSave() {
    if (isPermissionsLoading || permissionsError) return;
    setPermissionSaveError("");
    setIsPermissionModalOpen(false);
    setPermissionSaveModalStep("confirm");
  }

  async function handleConfirmPermissionSave() {
    if (!selectedMember?.id || isPermissionsSaving) return;

    setIsPermissionsSaving(true);
    setPermissionSaveError("");
    const permissions = permissionRole === "ASSISTANT" ? memberPermissions : [];

    try {
      const response = await updateSpaceMemberRolePermissions(
        spaceId,
        selectedMember.id,
        { role: permissionRole, permissions },
      );
      const nextRole = response?.role ?? permissionRole;
      setSelectedMember((previous) => ({ ...previous, role: nextRole }));
      setMembers((previous) =>
        previous.map((member) =>
          member.id === selectedMember.id ? { ...member, role: nextRole } : member,
        ),
      );
      setPermissionSaveModalStep("complete");
    } catch (error) {
      setPermissionSaveError(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "멤버 권한을 저장하지 못했습니다.",
      );
    } finally {
      setIsPermissionsSaving(false);
    }
  }

  function handleCancelPermissionSave() {
    if (isPermissionsSaving) return;
    setPermissionSaveModalStep(null);
    setPermissionSaveError("");
    setIsPermissionModalOpen(true);
  }

  function handleCompletePermissionSave() {
    setPermissionSaveModalStep(null);
    setPermissionSaveError("");
  }

  function handleReturnToJoinRequests() {
    setIsAssistantPermissionMenuOpen(false);
    setSelectedMemberId(null);
    setSelectedMember(null);
    setErrorMessage("");
  }

  function handleOpenKickModal() {
    if (!selectedMember?.id || !isProfessor) return;
    setKickTarget(selectedMember);
    setKickError("");
    setKickModalStep("confirm");
  }

  async function handleConfirmKick() {
    if (!kickTarget?.id || isKickingMember) return;

    setIsKickingMember(true);
    setKickError("");

    try {
      await deleteSpaceMember(spaceId, kickTarget.id);
      setMembers((previous) => previous.filter((member) => member.id !== kickTarget.id));
      setTotalCount((previous) => Math.max(0, previous - 1));
      setKickModalStep("complete");
    } catch (error) {
      setKickError(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "멤버를 내보내지 못했습니다.",
      );
    } finally {
      setIsKickingMember(false);
    }
  }

  function handleCloseKickModal() {
    if (isKickingMember) return;

    if (kickModalStep === "complete") {
      setSelectedMemberId(null);
      setSelectedMember(null);
    }
    setKickModalStep(null);
    setKickTarget(null);
    setKickError("");
  }

  const canManageSelectedMember =
    isProfessor &&
    selectedMember &&
    ["STUDENT", "ASSISTANT"].includes(selectedMember.role);
  const hasStudentDetailRestriction = isStudent && !canManageMembers;
  const isViewingOwnAssistantProfile =
    isCurrentUserAssistant && selectedMember?.id === currentSpaceMemberId;

  return (
    <main className="members-page space-page-transition">
      <div className="members-background" aria-hidden="true">
        <div className="members-page__orb members-page__orb--left" />
        <div className="members-page__orb members-page__orb--right" />
      </div>
      <div className="app-frame members-frame">
        <button type="button" className="members-back" aria-label="Space 목록으로 돌아가기" onClick={() => navigate("/spaces")}>
          <img src={backIcon} alt="" />
        </button>
        <header className="members-header"><h1>{spaceName}</h1><p>{canManageMembers ? "멤버 관리" : "멤버"}</p></header>
        <AppToolbars showBottomNavigation={false} onSearch={() => navigate("/search")} />

        <section className="members-layout" aria-label={`${spaceName} 멤버`}>
          <aside className="members-list-panel">
            <div className="members-list-panel__header"><strong>멤버</strong><span>{totalCount}명</span></div>
            <div className="members-list-panel__divider" aria-hidden="true" />
            {isLoading ? <p className="members-state">멤버를 불러오는 중입니다.</p> : null}
            {!isLoading && errorMessage && !selectedMemberId ? <p className="members-state members-state--error">{errorMessage}</p> : null}
            {!isLoading && !errorMessage && members.length === 0 ? <p className="members-state">참여 중인 멤버가 없습니다.</p> : null}
            {!isLoading && members.length > 0 ? (
              <div className="members-list">
                {members.map((member) => {
                  const isDetailRestricted =
                    hasStudentDetailRestriction && !isOwnMember(member, currentUser);

                  return (
                    <button
                      key={member.id}
                      type="button"
                      className={`members-list-item${selectedMemberId === member.id ? " is-selected" : ""}`}
                      disabled={isDetailRestricted}
                      aria-label={
                        isDetailRestricted
                          ? `${member.name} 상세 조회 권한 없음`
                          : `${member.name} 상세 조회`
                      }
                      onClick={() => handleSelectMember(member)}
                    >
                      <img
                        className="members-list-item__avatar"
                        src={member.profileUrl || profileAvatar}
                        alt=""
                      />
                      <span className="members-list-item__body">
                        <strong>{member.name}</strong>
                        <small>
                          {[roleLabel(member.role), member.studentNumber]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </aside>

          <section className="member-detail-panel" aria-live="polite">
            {selectedMemberId && canManageMembers ? (
              <button
                type="button"
                className="member-detail-panel__return"
                onClick={handleReturnToJoinRequests}
              >
                ← 승인 대기로 돌아가기
              </button>
            ) : null}
            {selectedMember?.role === "ASSISTANT" && isProfessor ? (
              <div className="member-detail__permission-menu">
                <button
                  type="button"
                  className="member-detail__permission-menu-trigger"
                  aria-label="조교 권한 메뉴"
                  aria-expanded={isAssistantPermissionMenuOpen}
                  onClick={() =>
                    setIsAssistantPermissionMenuOpen((previous) => !previous)
                  }
                >
                  <img src={moreIcon} alt="" />
                </button>
                {isAssistantPermissionMenuOpen ? (
                  <button
                    type="button"
                    className="member-detail__permission-menu-item"
                    onClick={handleOpenPermissionModal}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        WebkitMaskImage: `url("${assistantSaveIcon}")`,
                        maskImage: `url("${assistantSaveIcon}")`,
                      }}
                    />
                    조교 권한 관리
                  </button>
                ) : null}
              </div>
            ) : null}
            {!selectedMemberId && canManageMembers ? (
              <section className="member-management" aria-label="멤버 참여 관리">
                <h2>승인 대기</h2>
                <p className="member-management__description">
                  수강 신청을 확인하고 강의 참여 권한을 관리하세요
                </p>
                {joinRequests.length > 0 ? (
                  <button
                    type="button"
                    className="member-management__selected-approve"
                    disabled={selectedJoinRequestIds.length === 0}
                    onClick={handleOpenApprovalModal}
                  >
                    선택 승인
                  </button>
                ) : null}
                <div className="member-management__divider member-management__divider--top" aria-hidden="true" />

                <div className="member-management__requests">
                  {isJoinRequestsLoading ? (
                    <p className="member-management__state">승인 대기 목록을 불러오는 중입니다.</p>
                  ) : null}
                  {!isJoinRequestsLoading && joinRequestsError ? (
                    <p className="member-management__state member-management__state--error">{joinRequestsError}</p>
                  ) : null}
                  {!isJoinRequestsLoading && !joinRequestsError && joinRequests.length === 0 ? (
                    <div className="member-management__empty">
                      <img src={memberBackgroundIcon} alt="" />
                      <strong>현재 승인 대기 중인 학생이 없습니다</strong>
                      <p>새로운 참여 신청이 들어오면<br />이곳에서 승인 또는 거절할 수 있습니다</p>
                    </div>
                  ) : null}
                  {!isJoinRequestsLoading && !joinRequestsError && joinRequests.length > 0 ? (
                    <div className="member-management__request-table">
                      <div className="member-management__request-header">
                        <input
                          type="checkbox"
                          aria-label="승인 대기 요청 전체 선택"
                          checked={selectedJoinRequestIds.length === joinRequests.length}
                          onChange={handleToggleAllJoinRequests}
                        />
                        <span>프로필</span>
                        <span>이름</span>
                        <span>학번</span>
                        <span>신청일</span>
                      </div>
                      <div className="member-management__request-list">
                        {joinRequests.map((request) => (
                          <label className="member-management__request" key={request.id}>
                            <input
                              type="checkbox"
                              aria-label={`${request.name} 참여 요청 선택`}
                              checked={selectedJoinRequestIds.includes(request.id)}
                              onChange={() => handleToggleJoinRequest(request.id)}
                            />
                            <img src={request.profileUrl || profileAvatar} alt="" />
                            <strong>{request.name}</strong>
                            <span>{request.studentNumber || "-"}</span>
                            <time dateTime={request.requestedAt}>{formatJoinedDate(request.requestedAt)}</time>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="member-management__divider member-management__divider--settings" aria-hidden="true" />
                {isProfessor ? (
                  <div className="member-management__auto-approve">
                    <div>
                      <strong>자동 승인</strong>
                      <p className={settingsError ? "is-error" : ""}>
                        {settingsError || "강의 코드를 입력한 학생을 자동으로 승인합니다"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`member-management__switch${autoApprove ? " is-on" : ""}`}
                      role="switch"
                      aria-checked={autoApprove}
                      aria-label="강의 참여 자동 승인"
                      disabled={isUpdatingAutoApprove}
                      onClick={handleAutoApproveChange}
                    >
                      <span />
                    </button>
                  </div>
                ) : null}
                <div className="member-management__invite-code">
                  <strong>초대 코드</strong>
                  {inviteCode ? (
                    <button type="button" onClick={handleCopyInviteCode}>
                      <span>{isInviteCodeCopied ? "복사됨" : inviteCode}</span>
                    </button>
                  ) : (
                    <span className="member-management__invite-code-empty">-</span>
                  )}
                </div>
              </section>
            ) : null}
            {!selectedMemberId && !canManageMembers ? <div className="member-detail-empty"><img src={memberBackgroundIcon} alt="" /><strong>멤버를 선택해 확인하세요</strong><p>왼쪽 목록에서 확인할 멤버를 선택해 주세요.</p></div> : null}
            {isDetailLoading ? <p className="members-state">멤버 정보를 불러오는 중입니다.</p> : null}
            {!isDetailLoading && selectedMember ? (
              <article className="member-detail">
                <div className="member-detail__profile">
                  <img src={selectedMember.profileUrl || profileAvatar} alt="" />
                  <div>
                    <h2>{selectedMember.name}</h2>
                    <p>
                      {[roleLabel(selectedMember.role), selectedMember.major, selectedMember.studentNumber]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="member-detail__divider" />
                <dl>
                  <div>
                    <dt><img src={graduationCapIcon} alt="" />학교</dt>
                    <dd>{selectedMember.university || "-"}</dd>
                  </div>
                  <div>
                    <dt><img src={mailIcon} alt="" />이메일</dt>
                    <dd>{selectedMember.email || "-"}</dd>
                  </div>
                  <div>
                    <dt><img src={joinedDateIcon} alt="" />참여일</dt>
                    <dd>{formatJoinedDate(selectedMember.joinedAt)}</dd>
                  </div>
                </dl>
                {canManageSelectedMember ? (
                  <div className="member-detail__actions">
                    <button type="button" onClick={handleOpenPermissionModal}>
                      권한
                    </button>
                    <button
                      type="button"
                      className="member-detail__kick"
                      onClick={handleOpenKickModal}
                    >
                      추방
                    </button>
                  </div>
                ) : isViewingOwnAssistantProfile ? (
                  <div className="member-detail__actions">
                    <button type="button" onClick={handleOpenOwnPermissionModal}>
                      권한
                    </button>
                  </div>
                ) : null}
              </article>
            ) : null}
            {!isDetailLoading && selectedMemberId && !selectedMember && errorMessage ? <p className="members-state members-state--error">{errorMessage}</p> : null}
          </section>
        </section>
        <SpaceToolbar activeItem="member" spaceId={spaceId} spaceName={spaceName} />
      </div>

      {approvalModalStep ? (
        <MemberStatusModal
          action="approval"
          step={approvalModalStep}
          description={
            approvalModalStep === "complete"
              ? `${formatRequestSummary(approvalTargets)}이 새롭게 Space에 참여했습니다`
              : formatRequestSummary(approvalTargets)
          }
          errorMessage={approvalError}
          isSubmitting={isApprovingJoinRequests}
          onCancel={handleCloseApprovalModal}
          onConfirm={
            approvalModalStep === "complete"
              ? handleCloseApprovalModal
              : handleConfirmApproval
          }
        />
      ) : null}

      {kickModalStep ? (
        <MemberStatusModal
          action="kick"
          step={kickModalStep}
          description={
            kickModalStep === "complete"
              ? formatMemberSummary(kickTarget)
              : "Space 코드를 입력해 다시 입장 가능합니다"
          }
          errorMessage={kickError}
          isSubmitting={isKickingMember}
          onCancel={handleCloseKickModal}
          onConfirm={
            kickModalStep === "complete" ? handleCloseKickModal : handleConfirmKick
          }
        />
      ) : null}

      {isPermissionModalOpen ? (
        <MemberPermissionModal
          memberName={selectedMember?.name || "멤버"}
          role={permissionRole}
          permissions={memberPermissions}
          isLoading={isPermissionsLoading}
          errorMessage={permissionsError}
          readOnly={isPermissionReadOnly}
          onRoleChange={handlePermissionRoleChange}
          onPermissionToggle={handlePermissionToggle}
          onCancel={() => {
            if (!isPermissionsSaving) setIsPermissionModalOpen(false);
          }}
          onConfirm={handleRequestPermissionSave}
        />
      ) : null}

      {permissionSaveModalStep ? (
        <MemberStatusModal
          action="permission"
          step={permissionSaveModalStep}
          description={
            permissionSaveModalStep === "complete"
              ? `${selectedMember?.name || "선택한"} 학생의 권한이 저장되었습니다`
              : `${selectedMember?.name || "선택한"} 학생의 권한을 업데이트합니다`
          }
          errorMessage={permissionSaveError}
          isSubmitting={isPermissionsSaving}
          onCancel={handleCancelPermissionSave}
          onConfirm={
            permissionSaveModalStep === "complete"
              ? handleCompletePermissionSave
              : handleConfirmPermissionSave
          }
        />
      ) : null}
    </main>
  );
}

export default SpaceMembersPage;
