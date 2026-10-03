const START_MINUTES = 9 * 60;
const PIXELS_PER_HOUR = 57;
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
const HEADER_HEIGHT = 54;
const MIN_END_MINUTES = 24 * 60;

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getCoursePosition(course) {
  const start = toMinutes(course.start);
  const end = toMinutes(course.end);

  return {
    top: HEADER_HEIGHT + (start - START_MINUTES) * PIXELS_PER_MINUTE,
    height: (end - start) * PIXELS_PER_MINUTE,
  };
}

export function getTimetableEndMinutes(courses) {
  const latestEnd = courses.reduce((latest, course) => {
    const end = toMinutes(course.end);

    return Number.isFinite(end) ? Math.max(latest, end) : latest;
  }, MIN_END_MINUTES);

  return Math.ceil(latestEnd / 60) * 60;
}

export function getTimetableTimeLabels(endMinutes) {
  const hourCount = Math.max(0, Math.ceil((endMinutes - START_MINUTES) / 60));

  return Array.from({ length: hourCount }, (_, index) => {
    const totalMinutes = START_MINUTES + index * 60;
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");

    return `${hours}:00`;
  });
}

export function getTimetableMetrics(endMinutes) {
  const hourCount = Math.max(0, (endMinutes - START_MINUTES) / 60);

  return {
    hourCount,
    height: HEADER_HEIGHT + hourCount * PIXELS_PER_HOUR + 19,
  };
}

export function getTimetableBoundaryOffsets(endMinutes) {
  const hourCount = Math.max(0, (endMinutes - START_MINUTES) / 60);
  const fullHourCount = Math.floor(hourCount);
  const offsets = Array.from(
    { length: fullHourCount + 1 },
    (_, index) => index,
  );

  if (hourCount > fullHourCount) offsets.push(hourCount);

  return offsets;
}
