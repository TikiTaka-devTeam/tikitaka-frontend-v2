const START_MINUTES = 9 * 60;
const PIXELS_PER_HOUR = 57;
const HEADER_HEIGHT = 54;
const MIN_END_MINUTES = 18 * 60;

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getCoursePosition(course, pixelsPerHour = PIXELS_PER_HOUR) {
  const start = toMinutes(course.start);
  const end = toMinutes(course.end);
  const pixelsPerMinute = pixelsPerHour / 60;

  return {
    top: HEADER_HEIGHT + (start - START_MINUTES) * pixelsPerMinute,
    height: (end - start) * pixelsPerMinute,
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

  return Array.from({ length: hourCount + 1 }, (_, index) => {
    const totalMinutes = START_MINUTES + index * 60;
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");

    return hours;
  });
}

export function getTimetableMetrics(
  endMinutes,
  pixelsPerHour = PIXELS_PER_HOUR,
) {
  const hourCount = Math.max(0, (endMinutes - START_MINUTES) / 60);

  return {
    hourCount,
    height: HEADER_HEIGHT + hourCount * pixelsPerHour + 19,
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
