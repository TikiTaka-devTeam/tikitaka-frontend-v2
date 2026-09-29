const COURSE_COLORS = ["blue", "purple", "green", "sky", "red", "orange"];

export function getCourseColor(spaceId) {
  const value = String(spaceId ?? "");
  const hash = [...value].reduce(
    (currentHash, character) =>
      (currentHash * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );

  return COURSE_COLORS[hash % COURSE_COLORS.length];
}
