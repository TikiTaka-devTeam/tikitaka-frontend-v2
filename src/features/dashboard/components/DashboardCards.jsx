import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const visibleTasks = selectedCourse
    ? tasks.filter((task) => task.spaceId === selectedCourse.spaceId)
    : [...tasks].sort(
        (firstTask, secondTask) =>
          new Date(firstTask.dueAt).getTime() -
          new Date(secondTask.dueAt).getTime(),
      );

  const markAsRead = (taskId) => {
    setReadTaskIds((currentIds) => {
      if (currentIds.has(taskId)) {
        return currentIds;
      }

      return new Set([...currentIds, taskId]);
    });
  };

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
        <strong aria-label={`할 일 ${visibleTasks.length}개`}>
          {visibleTasks.length}
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
            className={readTaskIds.has(task.id) ? "is-read" : ""}
            key={task.id}
          >
            <button
              type="button"
              onClick={() => markAsRead(task.id)}
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
    </section>
  );
}
