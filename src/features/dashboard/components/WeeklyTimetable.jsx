import { useEffect, useMemo, useRef, useState } from "react";

import {
  getCoursePosition,
  getTimetableEndMinutes,
  getTimetableBoundaryOffsets,
  getTimetableMetrics,
  getTimetableTimeLabels,
} from "../utils/timetable.js";
import { getSpaceColor } from "../../spaces/utils/spaceColors.js";

const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"];

const DAY_LABELS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const TIME_LABEL_WIDTH = 75;

function getMobileDayIndexes(todayIndex) {
  if (todayIndex <= 0) return [0, 1];
  if (todayIndex >= 6) return [5, 6];

  return [todayIndex - 1, todayIndex, todayIndex + 1];
}

function getTodayIndex() {
  return (new Date().getDay() + 6) % 7;
}

function CourseBlock({ course, dayIndex, dayWidth, isSelected, onSelect }) {
  const { top, height } = getCoursePosition(course);
  const spaceColor = course.colorKey ? getSpaceColor(course.colorKey) : null;

  return (
    <button
      type="button"
      className={`dashboard-course dashboard-course--${course.color}${isSelected ? " is-selected" : ""}`}
      style={{
        "--course-day": course.day,
        "--course-day-index": dayIndex,
        "--course-left": `${TIME_LABEL_WIDTH + dayIndex * dayWidth + 9}px`,
        "--course-top": `${top}px`,
        "--course-height": `${height}px`,
        ...(spaceColor && {
          "--course-bg": spaceColor.background,
          "--course-color": spaceColor.accent,
        }),
      }}
      aria-pressed={isSelected}
      aria-label={`${course.title}, ${course.start} – ${course.end}, ${course.room}`}
      onClick={() => onSelect(course)}
    >
      <span className="dashboard-course__accent" aria-hidden="true" />
      <div className="dashboard-course__content">
        <h3>{course.title}</h3>
        <p>
          {course.start} – {course.end}
          <br />
          {course.room}
        </p>
      </div>
    </button>
  );
}

function WeeklyTimetable({
  semesterLabel,
  courses,
  selectedCourseId,
  onCourseSelect,
  isLoading,
  errorMessage,
}) {
  const todayIndex = getTodayIndex();
  const timetableRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [timetableWidth, setTimetableWidth] = useState(0);
  const [mobileDayAnchor, setMobileDayAnchor] = useState(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 600px)");
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  useEffect(() => {
    if (!timetableRef.current) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setTimetableWidth(entry.contentRect.width);
    });

    observer.observe(timetableRef.current);

    return () => observer.disconnect();
  }, []);

  const visibleDayIndexes = useMemo(() => {
    if (!isMobile) return WEEK_DAYS.map((_, index) => index);

    return getMobileDayIndexes(mobileDayAnchor ?? todayIndex);
  }, [isMobile, mobileDayAnchor, todayIndex]);

  const timeLabels = useMemo(
    () => getTimetableTimeLabels(getTimetableEndMinutes(courses)),
    [courses],
  );
  const timetableEndMinutes = getTimetableEndMinutes(courses);
  const timetableMetrics = getTimetableMetrics(timetableEndMinutes);
  const timetableBoundaryOffsets = getTimetableBoundaryOffsets(
    timetableEndMinutes,
  );
  const dayWidth = timetableWidth
    ? Math.max(0, (timetableWidth - TIME_LABEL_WIDTH) / visibleDayIndexes.length)
    : 0;
  const visibleCourses = courses.filter((course) =>
    visibleDayIndexes.includes(course.day),
  );
  const todayVisibleIndex = visibleDayIndexes.indexOf(todayIndex);
  const currentMobileDay = mobileDayAnchor ?? todayIndex;

  return (
    <section
      className="dashboard-timetable"
      ref={timetableRef}
      style={{
        "--day-width": `${dayWidth}px`,
        "--timetable-height": `${timetableMetrics.height}px`,
      }}
      aria-label={`${semesterLabel} 주간 시간표`}
    >
      <div className="dashboard-timetable__sticky-header">
        <div className="dashboard-timetable__header-wash" aria-hidden="true" />

        <button
          className="dashboard-timetable__day-control dashboard-timetable__day-control--previous"
          type="button"
          aria-label="이전 날짜 보기"
          onClick={() =>
            setMobileDayAnchor((dayIndex) =>
              Math.max(0, (dayIndex ?? todayIndex) - 1),
            )
          }
          disabled={!isMobile || currentMobileDay === 0}
        >
          ‹
        </button>
        <button
          className="dashboard-timetable__day-control dashboard-timetable__day-control--next"
          type="button"
          aria-label="다음 날짜 보기"
          onClick={() =>
            setMobileDayAnchor((dayIndex) =>
              Math.min(6, (dayIndex ?? todayIndex) + 1),
            )
          }
          disabled={!isMobile || currentMobileDay === 6}
        >
          ›
        </button>

        <div className="dashboard-timetable__corner">시간</div>
        {visibleDayIndexes.map((dayIndex, index) => (
          <div
            className={`dashboard-timetable__day${dayIndex === todayIndex ? " is-today" : ""}`}
            style={{
              "--day-index": index,
              "--day-left": `${TIME_LABEL_WIDTH + index * dayWidth}px`,
            }}
            key={DAY_LABELS[dayIndex]}
          >
            {WEEK_DAYS[dayIndex]}
            {dayIndex === todayIndex ? <span aria-hidden="true" /> : null}
          </div>
        ))}
      </div>

      {todayVisibleIndex >= 0 ? (
        <div
          className="dashboard-timetable__today"
          style={{
            "--today-index": todayVisibleIndex,
            "--today-left": `${TIME_LABEL_WIDTH + todayVisibleIndex * dayWidth}px`,
          }}
          aria-hidden="true"
        />
      ) : null}

      <div className="dashboard-timetable__grid" aria-hidden="true">
        {Array.from({ length: visibleDayIndexes.length + 1 }, (_, index) => (
          <i
            className="vertical"
            style={{
              "--line-left": `${TIME_LABEL_WIDTH + index * dayWidth}px`,
            }}
            key={`v-${index}`}
          />
        ))}
        {timetableBoundaryOffsets.map((offset) => (
          <i
            className="horizontal"
            style={{ "--time-top": `${54 + offset * 57}px` }}
            key={`h-${offset}`}
          />
        ))}
      </div>

      {timeLabels.map((time, index) => (
        <time
          className="dashboard-timetable__time"
          style={{ "--time-top": `${60 + index * 57}px` }}
          key={time}
        >
          {time}
        </time>
      ))}

      {visibleCourses.map((course) => (
        <CourseBlock
          course={course}
          dayIndex={visibleDayIndexes.indexOf(course.day)}
          dayWidth={dayWidth}
          isSelected={course.id === selectedCourseId}
          onSelect={onCourseSelect}
          key={course.id}
        />
      ))}

      {isLoading ? (
        <p className="dashboard-timetable__status" role="status">
          시간표를 불러오는 중입니다.
        </p>
      ) : null}
      {!isLoading && errorMessage ? (
        <p className="dashboard-timetable__status" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {!isLoading && !errorMessage && courses.length === 0 ? (
        <p className="dashboard-timetable__status">
          등록된 시간표가 없습니다.
        </p>
      ) : null}
    </section>
  );
}

export default WeeklyTimetable;
