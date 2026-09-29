import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import BrandLogo from "../../../components/common/BrandLogo.jsx";
import { AppToolbars } from "../../../components/common/AppToolbars.jsx";

import ActivateCompleteModal from "../components/ActivateCompleteModal.jsx";
import ActivateConfirmModal from "../components/ActivateConfirmModal.jsx";
import ArchiveCompleteModal from "../components/ArchiveCompleteModal.jsx";
import ArchiveConfirmModal from "../components/ArchiveConfirmModal.jsx";
import CreateSpaceModal from "../components/CreateSpaceModal.jsx";
import DeleteCompleteModal from "../components/DeleteCompleteModal.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import JoinCompleteModal from "../components/JoinCompleteModal.jsx";
import JoinSpaceModal from "../components/JoinSpaceModal.jsx";
import SaveCompleteModal from "../components/SaveCompleteModal.jsx";
import SaveConfirmModal from "../components/SaveConfirmModal.jsx";
import SpaceCard from "../components/SpaceCard.jsx";
import SpaceEmptyState from "../components/SpaceEmptyState.jsx";

import {
  archiveSpace,
  createSpace,
  deleteSpace,
  getSpaces,
  joinSpace,
  restoreSpace,
  updateSpace,
} from "../api/spacesApi.js";

import "../styles/spaces.css";

const DAY_LABELS = {
  MONDAY: "월",
  TUESDAY: "화",
  WEDNESDAY: "수",
  THURSDAY: "목",
  FRIDAY: "금",
  SATURDAY: "토",
  SUNDAY: "일",
};

const DAY_API_VALUES = {
  월: "MONDAY",
  화: "TUESDAY",
  수: "WEDNESDAY",
  목: "THURSDAY",
  금: "FRIDAY",
  토: "SATURDAY",
  일: "SUNDAY",
};

function readUserRole() {
  const getRoleFromUser = (user) => {
    if (!user || typeof user !== "object") {
      return "";
    }

    return (
      user.account_type ??
      user.accountType ??
      user.role ??
      user.user?.account_type ??
      user.user?.accountType ??
      user.user?.role ??
      ""
    );
  };

  const userStorageKeys = ["tikitaka_user", "user"];

  for (const key of userStorageKeys) {
    const rawUser = localStorage.getItem(key);

    if (!rawUser) {
      continue;
    }

    try {
      const parsedUser = JSON.parse(rawUser);

      const role = getRoleFromUser(parsedUser);

      if (role) {
        return String(role).toUpperCase();
      }
    } catch {
      continue;
    }
  }

  const directRole =
    localStorage.getItem("tikitaka_account_type") ??
    localStorage.getItem("account_type") ??
    localStorage.getItem("role") ??
    "";

  return String(directRole).toUpperCase();
}

function formatSchedules(schedules = []) {
  if (!Array.isArray(schedules)) {
    return "";
  }

  const formatTime = (time) =>
    String(time ?? "").replace(/^(\d{2}:\d{2}):\d{2}$/, "$1");

  return schedules
    .map((schedule) => {
      const day = DAY_LABELS[schedule.day] ?? schedule.day ?? "";

      const startTime = formatTime(schedule.start_time);

      const endTime = formatTime(schedule.end_time);

      if (startTime && endTime) {
        return `${day} ${startTime} - ${endTime}`;
      }

      if (startTime) {
        return `${day} ${startTime}`;
      }

      return day;
    })
    .filter(Boolean)
    .join(" / ");
}

function normalizeApprovedSpace(space, requestedStatus) {
  const semester =
    space.year && space.semester
      ? `${space.year}-${space.semester}`
      : (space.semester ?? "");

  return {
    id: space.space_id,

    name: space.space_name ?? "",

    semester,

    professor: space.professor_name ?? "",

    schedule: formatSchedules(space.schedules),

    room: space.classroom ?? "",

    classroom: space.classroom ?? "",

    schedules: space.schedules ?? [],

    color: space.color_key ?? "COLOR_1",

    spaceCode: space.space_code ?? null,

    status: space.status ?? requestedStatus,

    archived: (space.status ?? requestedStatus) === "ARCHIVED",

    participationStatus: "APPROVED",

    isPending: false,
  };
}

function normalizePendingSpace(space) {
  return {
    id: space.space_id,

    spaceMemberId: space.space_member_id,

    name: space.space_name ?? "",

    semester: "",

    professor: space.professor_name ?? "",

    schedule: formatSchedules(space.schedules),

    room: space.classroom ?? "",

    classroom: space.classroom ?? "",

    schedules: space.schedules ?? [],

    color: space.color_key ?? "COLOR_1",

    status: "ACTIVE",

    archived: false,

    participationStatus: space.status ?? "PENDING",

    requestedAt: space.requested_at ?? null,

    isPending: true,
  };
}

function normalizeSpacesResponse(data, status) {
  const approvedSpaces = (data?.spaces ?? []).map((space) =>
    normalizeApprovedSpace(space, status),
  );

  const pendingSpaces =
    status === "ACTIVE"
      ? (data?.pending_spaces ?? []).map(normalizePendingSpace)
      : [];

  return [...approvedSpaces, ...pendingSpaces];
}

function getSpaceList(data, status) {
  return normalizeSpacesResponse(data, status);
}

function formatScheduleTime(time) {
  const digits = String(time).replace(/\D/g, "").slice(0, 4);

  const hour = digits.slice(0, 2);
  const minute = digits.slice(2, 4);

  return `${hour}:${minute}`;
}

function createSpaceRequestData(formData) {
  const schedules = (formData?.schedules ?? []).flatMap((schedule) => {
    const startTime = formatScheduleTime(schedule.startTime);

    const endTime = formatScheduleTime(schedule.endTime);

    return (schedule.days ?? [])
      .map((day) => ({
        day: DAY_API_VALUES[day],
        start_time: startTime,
        end_time: endTime,
      }))
      .filter((scheduleItem) => Boolean(scheduleItem.day));
  });

  return {
    space_name: formData?.name?.trim() ?? "",

    classroom: formData?.classroom?.trim() ?? "",

    schedules,
  };
}

function getApiErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ?? error?.response?.data?.error ?? fallback
  );
}

function SpacesPage() {
  const navigate = useNavigate();

  const userRole = readUserRole();

  const isProfessor = userRole === "PROFESSOR";

  const isStudent = userRole === "STUDENT";

  const [selectedTab, setSelectedTab] = useState("active");

  const [spaces, setSpaces] = useState([]);

  const [isSpacesLoading, setIsSpacesLoading] = useState(true);

  const [spacesError, setSpacesError] = useState("");

  const [spaceModalStep, setSpaceModalStep] = useState(null);

  const [spaceModalMode, setSpaceModalMode] = useState("create");

  const [pendingSpaceData, setPendingSpaceData] = useState(null);

  const [editingSpaceId, setEditingSpaceId] = useState(null);

  const [isSaving, setIsSaving] = useState(false);

  const [archiveModalStep, setArchiveModalStep] = useState(null);

  const [archivingSpaceId, setArchivingSpaceId] = useState(null);

  const [isArchiving, setIsArchiving] = useState(false);

  const [activateModalStep, setActivateModalStep] = useState(null);

  const [activatingSpaceId, setActivatingSpaceId] = useState(null);

  const [isActivating, setIsActivating] = useState(false);

  const [deleteModalStep, setDeleteModalStep] = useState(null);

  const [deletingSpaceId, setDeletingSpaceId] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const [joinModalStep, setJoinModalStep] = useState(null);

  const [isJoining, setIsJoining] = useState(false);

  const loadSpaces = useCallback(
    async (statusOverride = null) => {
      const status =
        statusOverride ?? (selectedTab === "active" ? "ACTIVE" : "ARCHIVED");

      try {
        const data = await getSpaces(status);

        setSpaces(getSpaceList(data, status));
        setSpacesError("");
      } catch (error) {
        console.error("Space 목록 조회 실패:", error);

        setSpaces([]);
        setSpacesError("Space 목록을 불러오지 못했습니다.");
      } finally {
        setIsSpacesLoading(false);
      }
    },
    [selectedTab],
  );

  useEffect(() => {
    const controller = new AbortController();

    const status = selectedTab === "active" ? "ACTIVE" : "ARCHIVED";

    getSpaces(status, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }

        setSpaces(getSpaceList(data, status));
        setSpacesError("");
      })
      .catch((error) => {
        if (controller.signal.aborted || error.code === "ERR_CANCELED") {
          return;
        }

        console.error("Space 목록 조회 실패:", error);

        setSpaces([]);
        setSpacesError("Space 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (controller.signal.aborted) {
          return;
        }

        setIsSpacesLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [selectedTab]);

  const handleActiveTab = () => {
    if (selectedTab === "active") {
      return;
    }

    setIsSpacesLoading(true);

    setSelectedTab("active");
  };

  const handleArchivedTab = () => {
    if (selectedTab === "archived") {
      return;
    }

    setIsSpacesLoading(true);

    setSelectedTab("archived");
  };

  const handleAddSpace = () => {
    if (!isProfessor) {
      return;
    }

    setSpaceModalMode("create");

    setPendingSpaceData(null);

    setEditingSpaceId(null);

    setSpaceModalStep("create");
  };

  const handleJoinSpace = () => {
    if (!isStudent) {
      return;
    }

    setJoinModalStep("join");
  };

  const handleCloseJoinSpace = () => {
    if (isJoining) {
      return;
    }

    setJoinModalStep(null);
  };

  const handleJoinSpaceSubmit = async (spaceCode) => {
    if (!isStudent || isJoining) {
      return;
    }

    setIsJoining(true);

    try {
      await joinSpace(spaceCode);

      setSelectedTab("active");

      setIsSpacesLoading(true);

      await loadSpaces("ACTIVE");

      setJoinModalStep("complete");
    } catch (error) {
      console.error("Space 참여 신청 실패:", error);

      window.alert(
        getApiErrorMessage(error, "Space 참여 신청에 실패했습니다."),
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinCompleteConfirm = () => {
    setJoinModalStep(null);
  };

  const handleCloseCreateModal = () => {
    setSpaceModalStep(null);

    setSpaceModalMode("create");

    setPendingSpaceData(null);

    setEditingSpaceId(null);
  };

  const handleCreateSpaceSave = (spaceData) => {
    if (!isProfessor) {
      return;
    }

    setPendingSpaceData(spaceData);

    setSpaceModalStep("confirm");
  };

  const handleConfirmCancel = () => {
    if (isSaving) {
      return;
    }

    setSpaceModalStep("create");
  };

  const handleConfirmSave = async () => {
    if (!isProfessor || isSaving || !pendingSpaceData) {
      return;
    }

    if (spaceModalMode === "edit" && !editingSpaceId) {
      return;
    }

    const requestData = createSpaceRequestData(pendingSpaceData);

    setIsSaving(true);

    try {
      if (spaceModalMode === "edit") {
        await updateSpace(editingSpaceId, requestData);

        setIsSpacesLoading(true);

        await loadSpaces(selectedTab === "active" ? "ACTIVE" : "ARCHIVED");
      } else {
        await createSpace(requestData);

        setSelectedTab("active");

        setIsSpacesLoading(true);

        await loadSpaces("ACTIVE");
      }

      setSpaceModalStep("complete");
    } catch (error) {
      console.error(
        spaceModalMode === "edit" ? "Space 수정 실패:" : "Space 생성 실패:",
        error,
      );

      window.alert(
        getApiErrorMessage(
          error,
          spaceModalMode === "edit"
            ? "Space 수정에 실패했습니다."
            : "Space 생성에 실패했습니다.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteConfirm = () => {
    setSpaceModalStep(null);

    setSpaceModalMode("create");

    setPendingSpaceData(null);

    setEditingSpaceId(null);
  };

  const handleArchive = (spaceId) => {
    if (!isProfessor) {
      return;
    }

    setArchivingSpaceId(spaceId);

    setArchiveModalStep("confirm");
  };

  const handleArchiveCancel = () => {
    if (isArchiving) {
      return;
    }

    setArchivingSpaceId(null);

    setArchiveModalStep(null);
  };

  const handleArchiveConfirm = async () => {
    if (!isProfessor || !archivingSpaceId || isArchiving) {
      return;
    }

    setIsArchiving(true);

    try {
      await archiveSpace(archivingSpaceId);

      setIsSpacesLoading(true);

      await loadSpaces("ACTIVE");

      setArchiveModalStep("complete");
    } catch (error) {
      console.error("Space 보관 실패:", error);

      window.alert(getApiErrorMessage(error, "Space 보관에 실패했습니다."));
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveComplete = () => {
    setArchivingSpaceId(null);

    setArchiveModalStep(null);
  };

  const handleActivate = (spaceId) => {
    if (!isProfessor) {
      return;
    }

    setActivatingSpaceId(spaceId);

    setActivateModalStep("confirm");
  };

  const handleActivateCancel = () => {
    if (isActivating) {
      return;
    }

    setActivatingSpaceId(null);

    setActivateModalStep(null);
  };

  const handleActivateConfirm = async () => {
    if (!isProfessor || !activatingSpaceId || isActivating) {
      return;
    }

    setIsActivating(true);

    try {
      await restoreSpace(activatingSpaceId);

      setIsSpacesLoading(true);

      await loadSpaces("ARCHIVED");

      setActivateModalStep("complete");
    } catch (error) {
      console.error("Space 활성화 실패:", error);

      window.alert(getApiErrorMessage(error, "Space 활성화에 실패했습니다."));
    } finally {
      setIsActivating(false);
    }
  };

  const handleActivateComplete = () => {
    setActivatingSpaceId(null);

    setActivateModalStep(null);
  };

  const handleEdit = (spaceOrId) => {
    if (!isProfessor) {
      return;
    }

    const selectedSpace =
      typeof spaceOrId === "object"
        ? spaceOrId
        : spaces.find((space) => space.id === spaceOrId);

    if (!selectedSpace) {
      return;
    }

    setSpaceModalMode("edit");

    setEditingSpaceId(selectedSpace.id);

    setPendingSpaceData({
      name: selectedSpace.name ?? "",

      classroom: selectedSpace.classroom ?? selectedSpace.room ?? "",

      schedules: Array.isArray(selectedSpace.schedules)
        ? selectedSpace.schedules
        : [],
    });

    setSpaceModalStep("create");
  };

  const handleDelete = (spaceId) => {
    if (!isProfessor) {
      return;
    }

    setDeletingSpaceId(spaceId);

    setDeleteModalStep("confirm");
  };

  const handleDeleteCancel = () => {
    if (isDeleting) {
      return;
    }

    setDeletingSpaceId(null);

    setDeleteModalStep(null);
  };

  const handleDeleteConfirm = async () => {
    if (!isProfessor || !deletingSpaceId || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteSpace(deletingSpaceId);

      setIsSpacesLoading(true);

      await loadSpaces(selectedTab === "active" ? "ACTIVE" : "ARCHIVED");

      setDeleteModalStep("complete");
    } catch (error) {
      console.error("Space 삭제 실패:", error);

      window.alert(getApiErrorMessage(error, "Space 삭제에 실패했습니다."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteComplete = () => {
    setDeletingSpaceId(null);

    setDeleteModalStep(null);
  };

  const handleSearch = () => {
    navigate("/search");
  };

  const handleNotifications = () => {
    console.log("알림");
  };

  const handleOpenSpace = (space) => {
    if (space.isPending || selectedTab !== "active") {
      return;
    }

    navigate(`/spaces/${space.id}`, {
      state: { spaceName: space.name },
    });
  };

  return (
    <main className="spaces-page space-page-transition">
      <div className="spaces-background" aria-hidden="true">
        <div className="spaces-page__orb spaces-page__orb--left" />
        <div className="spaces-page__orb spaces-page__orb--right" />
      </div>

      <div className="app-frame spaces-frame">
        <BrandLogo variant="blue" className="app-brand" />

        <AppToolbars
          onSearch={handleSearch}
          onNotifications={handleNotifications}
        />

        <div className="app-container spaces-container">
          <div className="spaces-header">
            <div className="spaces-header__left">
              <h1 className="spaces-title">Space 목록</h1>

              <div
                className="spaces-tabs"
                role="tablist"
                aria-label="Space 상태"
              >
                <span
                  className="spaces-tabs__active-indicator"
                  aria-hidden="true"
                  style={{
                    transform:
                      selectedTab === "archived"
                        ? "translateX(59px)"
                        : "translateX(0)",
                  }}
                />
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedTab === "active"}
                  className={`spaces-tab ${
                    selectedTab === "active" ? "spaces-tab--selected" : ""
                  }`}
                  onClick={handleActiveTab}
                >
                  활성화
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedTab === "archived"}
                  className={`spaces-tab ${
                    selectedTab === "archived" ? "spaces-tab--selected" : ""
                  }`}
                  onClick={handleArchivedTab}
                >
                  보관됨
                </button>
              </div>
            </div>

            {isProfessor && (
              <button
                type="button"
                className="add-space-button"
                onClick={handleAddSpace}
              >
                Add Space
              </button>
            )}

            {isStudent && (
              <button
                type="button"
                className="add-space-button"
                onClick={handleJoinSpace}
              >
                Join Space
              </button>
            )}
          </div>

          {!isSpacesLoading && spaces.length > 0 && (
            <div className="space-grid">
              {spaces.map((space) => (
                <SpaceCard
                  key={
                    space.isPending
                      ? `pending-${space.spaceMemberId}`
                      : space.id
                  }
                  space={space}
                  canManage={isProfessor}
                  onArchive={handleArchive}
                  onActivate={handleActivate}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onOpen={
                    selectedTab === "active" ? handleOpenSpace : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

        {isSpacesLoading && (
          <p className="spaces-loading" role="status">
            Space를 불러오는 중입니다.
          </p>
        )}

        {!isSpacesLoading && spacesError && (
          <p className="spaces-loading" role="alert">
            {spacesError}
          </p>
        )}

        {!isSpacesLoading && !spacesError && spaces.length === 0 && (
          <SpaceEmptyState />
        )}
      </div>

      {isProfessor && spaceModalStep === "create" && (
        <CreateSpaceModal
          initialData={pendingSpaceData}
          onClose={handleCloseCreateModal}
          onSave={handleCreateSpaceSave}
        />
      )}

      {isProfessor && spaceModalStep === "confirm" && (
        <SaveConfirmModal
          mode={spaceModalMode}
          onCancel={handleConfirmCancel}
          onConfirm={handleConfirmSave}
        />
      )}

      {isProfessor && spaceModalStep === "complete" && (
        <SaveCompleteModal
          mode={spaceModalMode}
          onConfirm={handleCompleteConfirm}
        />
      )}

      {isProfessor && archiveModalStep === "confirm" && (
        <ArchiveConfirmModal
          onCancel={handleArchiveCancel}
          onConfirm={handleArchiveConfirm}
        />
      )}

      {isProfessor && archiveModalStep === "complete" && (
        <ArchiveCompleteModal onConfirm={handleArchiveComplete} />
      )}

      {isProfessor && activateModalStep === "confirm" && (
        <ActivateConfirmModal
          onCancel={handleActivateCancel}
          onConfirm={handleActivateConfirm}
        />
      )}

      {isProfessor && activateModalStep === "complete" && (
        <ActivateCompleteModal onConfirm={handleActivateComplete} />
      )}

      {isProfessor && deleteModalStep === "confirm" && (
        <DeleteConfirmModal
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {isProfessor && deleteModalStep === "complete" && (
        <DeleteCompleteModal onConfirm={handleDeleteComplete} />
      )}

      {isStudent && joinModalStep === "join" && (
        <JoinSpaceModal
          onClose={handleCloseJoinSpace}
          onJoin={handleJoinSpaceSubmit}
          isSubmitting={isJoining}
        />
      )}

      {isStudent && joinModalStep === "complete" && (
        <JoinCompleteModal onConfirm={handleJoinCompleteConfirm} />
      )}
    </main>
  );
}

export default SpacesPage;
