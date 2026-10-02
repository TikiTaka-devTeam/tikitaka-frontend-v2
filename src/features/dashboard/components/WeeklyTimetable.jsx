import { getCoursePosition } from "../utils/timetable.js";
import { getSpaceColor } from "../../spaces/utils/spaceColors.js";

const WEEK_DAYS = ["월", "화", "수", "목", "금"];

const TIMES = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

function CourseBlock({ course, isSelected, onSelect }) {
  const { top, height } = getCoursePosition(course);
  const spaceColor = course.colorKey ? getSpaceColor(course.colorKey) : null;

  return (
    <button
      type="button"
      className={`dashboard-course dashboard-course--${course.color}${isSelected ? " is-selected" : ""}`}
      style={{
        "--course-day": course.day,
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
  const todayIndex = new Date().getDay() - 1;

  return (
    <section
      className="dashboard-timetable"
      aria-label={`${semesterLabel} 주간 시간표`}
    >
      <div className="dashboard-timetable__header-wash" aria-hidden="true" />
      {todayIndex >= 0 && todayIndex < WEEK_DAYS.length ? (
        <div
          className="dashboard-timetable__today"
          style={{ "--today-index": todayIndex }}
          aria-hidden="true"
        />
      ) : null}

      <div className="dashboard-timetable__corner">시간</div>
      {WEEK_DAYS.map((day, index) => (
        <div
          className={`dashboard-timetable__day${index === todayIndex ? " is-today" : ""}`}
          style={{ "--day-index": index }}
          key={day}
        >
          {day}
          {index === todayIndex ? <span aria-hidden="true" /> : null}
        </div>
      ))}

      <div className="dashboard-timetable__grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <i className="vertical" key={`v-${index}`} />
        ))}
        {TIMES.map((time) => (
          <i className="horizontal" key={time} />
        ))}
      </div>

      {TIMES.map((time, index) => (
        <time
          className="dashboard-timetable__time"
          style={{ "--time-index": index }}
          key={time}
        >
          {time}
        </time>
      ))}

      {courses.map((course) => (
        <CourseBlock
          course={course}
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
