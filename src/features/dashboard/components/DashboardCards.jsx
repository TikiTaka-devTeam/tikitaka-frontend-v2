import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SPACES_PATH, TASKS } from "../data/dashboard.js";

export function NextClassCard() {
  const navigate = useNavigate();

  return (
    <section className="dashboard-glass-card dashboard-next-class" aria-labelledby="next-class-title">
      <span className="dashboard-card__eyebrow">다음 강의</span>
      <span className="dashboard-next-class__badge">15분 후</span>
      <h2 id="next-class-title">인터넷프로토콜</h2>
      <p>10:30 – 12:00 · 공학관 204호</p>
      <button type="button" onClick={() => navigate(SPACES_PATH)}>To Space</button>
    </section>
  );
}

export function TaskSummaryCard() {
  const [readTaskIds, setReadTaskIds] = useState(() => new Set());

  const markAsRead = (taskId) => {
    setReadTaskIds((currentIds) => {
      if (currentIds.has(taskId)) {
        return currentIds;
      }

      return new Set([...currentIds, taskId]);
    });
  };

  return (
    <section className="dashboard-glass-card dashboard-tasks" aria-labelledby="dashboard-tasks-title">
      <header>
        <div>
          <h2 id="dashboard-tasks-title">할 일 모아보기</h2>
          <span>TASK</span>
        </div>
        <strong aria-label={`할 일 ${TASKS.length}개`}>{TASKS.length}</strong>
      </header>
      <ul>
        {TASKS.map((task) => (
          <li className={readTaskIds.has(task.id) ? "is-read" : ""} key={task.id}>
            <button type="button" onClick={() => markAsRead(task.id)} aria-label={`${task.title}, ${task.due}`}>
              <span className={`dashboard-task__dot dashboard-task__dot--${task.color}`} aria-hidden="true" />
              <span className="dashboard-task__title">{task.title}</span>
              <time>{task.due}</time>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
