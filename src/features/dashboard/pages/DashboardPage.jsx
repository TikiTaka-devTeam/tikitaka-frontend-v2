import { useEffect, useState } from "react";

import {
  NextClassCard,
  TaskSummaryCard,
} from "../components/DashboardCards.jsx";
import WeeklyTimetable from "../components/WeeklyTimetable.jsx";
import {
  getDashboardAssignments,
  getDashboardTimetable,
} from "../api/dashboardApi.js";
import { getCourseColor } from "../utils/courseColor.js";
import { getSpaces } from "../../spaces/api/spacesApi.js";
import { setSpaceListCache } from "../../spaces/utils/spaceListCache.js";

import "../styles/dashboard.css";

const DAY_INDEXES = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

function formatTime(value) {
  const match = String(value ?? "").match(/^(\d{2}:\d{2})/);

  return match?.[1] ?? "";
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function normalizeTimetable(data, colorKeysBySpaceId) {
  if (!Array.isArray(data)) return [];

  return data.flatMap((space) =>
    (Array.isArray(space.schedules) ? space.schedules : []).flatMap(
      (schedule, scheduleIndex) => {
        const day = DAY_INDEXES[schedule.day];
        const start = formatTime(schedule.start_time);
        const end = formatTime(schedule.end_time);

        if (day === undefined || !start || !end) return [];

        return {
          id: `${space.space_id}-${schedule.day}-${start}-${scheduleIndex}`,
          spaceId: space.space_id,
          day,
          title: space.space_name ?? "이름 없는 강의",
          start,
          end,
          room: schedule.classroom ?? "",
          color: getCourseColor(space.space_id),
          colorKey: colorKeysBySpaceId.get(space.space_id) ?? space.color_key,
        };
      },
    ),
  );
}

function isSameDate(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatDueAt(value) {
  const dueDate = new Date(value);

  if (Number.isNaN(dueDate.getTime())) return "마감일 미정";

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const time = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(dueDate);

  if (isSameDate(dueDate, now)) return `오늘 ${time}`;
  if (isSameDate(dueDate, tomorrow)) return `내일 ${time}`;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(dueDate);
}

function normalizeAssignments(data) {
  const assignments = Array.isArray(data?.assignments) ? data.assignments : [];

  return assignments.map((assignment) => ({
    id: assignment.assignment_id,
    spaceId: assignment.space_id,
    spaceName: assignment.space_name ?? "",
    title: assignment.title ?? "제목 없는 과제",
    due: formatDueAt(assignment.due_at),
    dueAt: assignment.due_at,
    status: String(assignment.status ?? "").toUpperCase(),
    submissionStatus: String(assignment.submission_status ?? "").toUpperCase(),
    gradingStatus: String(assignment.grading_status ?? "").toUpperCase(),
    color: getCourseColor(assignment.space_id),
  }));
}

function getNextCourse(courses) {
  if (courses.length === 0) return null;

  const now = new Date();
  const currentDay = (now.getDay() + 6) % 7;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const candidates = courses.map((course) => {
    const start = toMinutes(course.start);
    const end = toMinutes(course.end);
    const isOngoing =
      course.day === currentDay && start <= currentMinutes && currentMinutes < end;
    let difference = (course.day - currentDay + 7) % 7;
    difference = difference * 24 * 60 + start - currentMinutes;

    if (difference < 0) difference += 7 * 24 * 60;

    return {
      ...course,
      difference: isOngoing ? 0 : difference,
      startsInLabel: isOngoing
        ? "진행 중"
        : difference < 60
          ? `${difference}분 후`
          : difference < 24 * 60
            ? `${Math.floor(difference / 60)}시간 후`
            : `${Math.floor(difference / (24 * 60))}일 후`,
    };
  });

  return candidates.sort(
    (firstCourse, secondCourse) => firstCourse.difference - secondCourse.difference,
  )[0];
}

function DashboardPage() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [colorKeysBySpaceId, setColorKeysBySpaceId] = useState(() => new Map());
  const [isTimetableLoading, setIsTimetableLoading] = useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(true);
  const [timetableError, setTimetableError] = useState("");
  const [assignmentsError, setAssignmentsError] = useState("");

  const now = new Date();
  const year = now.getFullYear();
  const semester = now.getMonth() < 6 ? 1 : 2;

  const semesterLabel = `${year}년 ${semester}학기`;
  const nextCourse = getNextCourse(courses);

  useEffect(() => {
    const controller = new AbortController();

    Promise.allSettled([
      getDashboardTimetable(year, semester, { signal: controller.signal }),
      getSpaces("ACTIVE", { signal: controller.signal }),
    ])
      .then(([timetableResult, spacesResult]) => {
        if (timetableResult.status === "rejected") {
          throw timetableResult.reason;
        }

        const activeSpacesResponse =
          spacesResult.status === "fulfilled"
            ? spacesResult.value
            : null;
        if (activeSpacesResponse) {
          setSpaceListCache(activeSpacesResponse, "ACTIVE");
        }
        const activeSpaces = activeSpacesResponse?.spaces ?? [];
        const colorKeysBySpaceId = new Map(
          activeSpaces.map((space) => [space.space_id, space.color_key]),
        );
        setColorKeysBySpaceId(colorKeysBySpaceId);

        setCourses(
          normalizeTimetable(timetableResult.value, colorKeysBySpaceId),
        );
        setTimetableError("");
      })
      .catch((error) => {
        if (controller.signal.aborted || error.code === "ERR_CANCELED") return;

        setCourses([]);
        setTimetableError("시간표를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsTimetableLoading(false);
      });

    getDashboardAssignments({ signal: controller.signal })
      .then((data) => {
        setTasks(normalizeAssignments(data));
        setAssignmentsError("");
      })
      .catch((error) => {
        if (controller.signal.aborted || error.code === "ERR_CANCELED") return;

        setTasks([]);
        setAssignmentsError("과제를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsAssignmentsLoading(false);
      });

    return () => controller.abort();
  }, [semester, year]);

  return (
    <main className="dashboard-page">
      <div className="dashboard-background" aria-hidden="true">
        <div className="dashboard-page__orb dashboard-page__orb--left" />
        <div className="dashboard-page__orb dashboard-page__orb--right" />
      </div>

      <div className="app-frame dashboard-frame">

        <div className="app-container dashboard-shell">
          <header className="dashboard-brand">
            <p>{semesterLabel}</p>
          </header>

          <div className="dashboard-content">
            <div className="dashboard-timetable-scroll">
              <WeeklyTimetable
                semesterLabel={semesterLabel}
                courses={courses}
                selectedCourseId={selectedCourse?.id}
                onCourseSelect={setSelectedCourse}
                isLoading={isTimetableLoading}
                errorMessage={timetableError}
              />
            </div>

            <aside className="dashboard-sidebar">
              <NextClassCard
                selectedCourse={selectedCourse}
                nextCourse={nextCourse}
                isLoading={isTimetableLoading}
                errorMessage={timetableError}
              />

              <TaskSummaryCard
                selectedCourse={selectedCourse}
                tasks={tasks}
                colorKeysBySpaceId={colorKeysBySpaceId}
                isLoading={isAssignmentsLoading}
                errorMessage={assignmentsError}
              />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;
