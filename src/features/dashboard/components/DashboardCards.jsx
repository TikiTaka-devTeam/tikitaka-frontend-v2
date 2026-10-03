import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import { getAssignmentDetail } from "../../assignments/api/assignmentsApi.js";

function readUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    return String(
      user?.account_type
      ?? user?.accountType
      ?? user?.role
      ?? user?.user?.account_type
      ?? user?.user?.accountType
      ?? user?.user?.role
      ?? localStorage.getItem("tikitaka_account_type")
      ?? localStorage.getItem("account_type")
      ?? localStorage.getItem("role")
      ?? "",
    ).toUpperCase();
  } catch {
    return "";
  }
}

function getTaskStatus(task) {
  return String(task?.status ?? "").toUpperCase();
}

function getSubmissionStatus(task) {
  return String(task?.submissionStatus ?? "").toUpperCase();
}

function getGradingStatus(task) {
  return String(task?.gradingStatus ?? "").toUpperCase();
}

export function NextClassCard({
  selectedCourse,
  nextCourse,
  isLoading,
  errorMessage,
}) {
  const navigate = useNavigate();
  const displayedCourse = selectedCourse ?? nextCourse;

  let description = "예정된 강의가 없습니다.";

  if (isLoading) {
    description = "강의 정보를 불러오는 중입니다.";
  } else if (errorMessage) {
    description = errorMessage;
  } else if (displayedCourse) {
    description = `${displayedCourse.start} – ${displayedCourse.end}${
      displayedCourse.room ? ` · ${displayedCourse.room}` : ""
    }`;
  }

  const handleOpenSpace = () => {
    if (!displayedCourse) return;

    navigate(`/spaces/${displayedCourse.spaceId}`, {
      state: { spaceName: displayedCourse.title },
    });
  };

  return (
    <section
      className="dashboard-glass-card dashboard-next-class"
      aria-labelledby="next-class-title"
    >
      <span className="dashboard-card__eyebrow">
        {selectedCourse ? "선택한 강의" : "다음 강의"}
      </span>
      {!selectedCourse && nextCourse?.startsInLabel ? (
        <span className="dashboard-next-class__badge">
          {nextCourse.startsInLabel}
        </span>
      ) : null}
      <h2 id="next-class-title">
        {displayedCourse?.title ?? "강의 정보 없음"}
      </h2>
      <p>{description}</p>
      {displayedCourse ? (
        <button type="button" onClick={handleOpenSpace}>
          To Space
        </button>
      ) : null}
    </section>
  );
}

export function TaskSummaryCard({
  selectedCourse,
  tasks,
  isLoading,
  errorMessage,
}) {
  const [readTaskIds, setReadTaskIds] = useState(() => new Set());
  const [deletedTask, setDeletedTask] = useState(null);
  const [openingTaskId, setOpeningTaskId] = useState(null);
  const navigate = useNavigate();
  const userRole = readUserRole();
  const isStudent = userRole === "STUDENT";
  const scopedTasks = selectedCourse
    ? tasks.filter((task) => task.spaceId === selectedCourse.spaceId)
    : tasks;
  const visibleTasks = scopedTasks
    .filter((task) =>
      isStudent
        ? true
        : getTaskStatus(task) === "OPEN" || getGradingStatus(task) === "DRAFT",
    )
    .sort(
        (firstTask, secondTask) =>
          new Date(firstTask.dueAt).getTime() -
          new Date(secondTask.dueAt).getTime(),
      );
  const pendingTaskCount = visibleTasks.filter(
    (task) => !isStudent || getSubmissionStatus(task) !== "SUBMITTED",
  ).length;

  async function handleOpenTask(task) {
    if (!task?.id || !task.spaceId || openingTaskId) return;

    setOpeningTaskId(task.id);

    try {
      const assignmentDetail = await getAssignmentDetail(task.id);
      if (assignmentDetail?.is_deleted === true || assignmentDetail?.deleted === true) {
        setDeletedTask(task);
        return;
      }

      const assignmentPath = readUserRole() === "PROFESSOR"
        ? "assignments/professor"
        : "assignments";

      navigate(`/spaces/${encodeURIComponent(task.spaceId)}/${assignmentPath}`, {
        state: {
          spaceName: task.spaceName,
          assignmentDetail,
        },
      });
    } catch (error) {
      const status = error?.response?.status;
      if (status === 404 || status === 410) {
        setDeletedTask(task);
      }
    } finally {
      setOpeningTaskId(null);
    }
  }

  return (
    <section
      className="dashboard-glass-card dashboard-tasks"
      aria-labelledby="dashboard-tasks-title"
    >
      <header>
        <div>
          <h2 id="dashboard-tasks-title">할 일 모아보기</h2>
          <span>TASK</span>
        </div>
        <strong aria-label={`할 일 ${pendingTaskCount}개`}>
          {pendingTaskCount}
        </strong>
      </header>
      <ul aria-live="polite">
        {isLoading ? (
          <li className="dashboard-tasks__empty">과제를 불러오는 중입니다.</li>
        ) : null}
        {!isLoading && errorMessage ? (
          <li className="dashboard-tasks__empty" role="alert">
            {errorMessage}
          </li>
        ) : null}
        {visibleTasks.map((task) => (
          <li
            className={
              isStudent && getSubmissionStatus(task) === "SUBMITTED"
                ? "is-read"
                : ""
            }
            key={task.id}
          >
            <button
              type="button"
              onClick={() => void handleOpenTask(task)}
              aria-label={`${task.title}, ${task.due}`}
            >
              <span
                className={`dashboard-task__dot dashboard-task__dot--${task.color}`}
                aria-hidden="true"
              />
              <span className="dashboard-task__title">{task.title}</span>
              <time dateTime={task.dueAt}>{task.due}</time>
            </button>
          </li>
        ))}
        {!isLoading && !errorMessage && visibleTasks.length === 0 ? (
          <li className="dashboard-tasks__empty">등록된 할 일이 없습니다.</li>
        ) : null}
      </ul>
      {deletedTask ? (
        <CompactModal
          onClose={() => setDeletedTask(null)}
          labelledBy="dashboard-deleted-task-title"
          describedBy="dashboard-deleted-task-description"
        >
            <div className="compact-modal__text">
              <h2 id="dashboard-deleted-task-title">과제가 삭제되었습니다</h2>
              <p id="dashboard-deleted-task-description">
                삭제된 과제는 확인할 수 없습니다.
              </p>
            </div>
            <ModalActions
              showCancel={false}
              confirmText="확인"
              onConfirm={() => setDeletedTask(null)}
            />
        </CompactModal>
      ) : null}
    </section>
  );
}
