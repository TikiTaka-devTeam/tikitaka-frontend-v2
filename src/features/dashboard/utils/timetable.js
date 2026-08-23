const START_MINUTES = 9 * 60;
const PIXELS_PER_HOUR = 57;

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getCoursePosition(course) {
  const start = toMinutes(course.layoutStart || course.start);
  const end = toMinutes(course.layoutEnd || course.end);
  const startOffset = ((start - START_MINUTES) / 60) * PIXELS_PER_HOUR;
  const durationInHours = (end - start) / 60;
  const startsOnHourBoundary = start % 60 === 0;
  const endsOnHourBoundary = end % 60 === 0;

  return {
    top: Math.ceil(54 + startOffset) + (startsOnHourBoundary ? 1 : 0),
    height:
      Math.floor(durationInHours * PIXELS_PER_HOUR) -
      (startsOnHourBoundary && endsOnHourBoundary ? 1 : 0),
  };
}
