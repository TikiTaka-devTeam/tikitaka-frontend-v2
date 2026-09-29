const START_MINUTES = 9 * 60;
const PIXELS_PER_HOUR = 57;
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
const HEADER_HEIGHT = 54;

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
