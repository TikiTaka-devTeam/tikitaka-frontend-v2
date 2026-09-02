import { COURSES, WEEK_DAYS } from "../data/dashboard.js";
import { getCoursePosition } from "../utils/timetable.js";

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

  return (
    <button
      type="button"
      className={`dashboard-course dashboard-course--${course.color}${isSelected ? " is-selected" : ""}`}
      style={{
        "--course-day": course.day,
        "--course-top": `${top}px`,
        "--course-height": `${height}px`,
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

function WeeklyTimetable({ semesterLabel, selectedCourseId, onCourseSelect }) {
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

      {COURSES.map((course) => (
        <CourseBlock
          course={course}
          isSelected={course.id === selectedCourseId}
          onSelect={onCourseSelect}
          key={course.id}
        />
      ))}
    </section>
  );
}

export default WeeklyTimetable;
