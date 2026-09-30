// Viewer-local previews only: never use cached data as a server version or
// skip revalidation. Pending strokes must not survive as saved previews.
export function rememberStrokePreview(cache, slideId, privateStrokes, sharedStrokes, limit = 20) {
  const next = new Map(cache);
  const saved = (strokes) => strokes.filter((stroke) =>
    !stroke.isDeleted && !String(stroke.id).startsWith("local-"),
  );
  next.delete(slideId);
  next.set(slideId, { privateStrokes: saved(privateStrokes), sharedStrokes: saved(sharedStrokes) });
  while (next.size > limit) next.delete(next.keys().next().value);
  return next;
}
