// Compare stable slide IDs, not page numbers: inserting a page renumbers the
// following pages without changing their content. Signed PDF URLs are ignored.
export function reconcileDocumentChanges(previous, slides) {
  const snapshot = slides.map((slide) => ({ id: String(slide.id), status: slide.status ?? "ACTIVE" }));
  const oldSlides = new Map((previous?.snapshot ?? []).map((slide) => [slide.id, slide]));
  const hasPending = previous?.changes?.some((change) => !change.reviewed);
  const changes = new Map((hasPending ? previous.changes : []).map((change) => [change.id, change]));
  for (const slide of snapshot) {
    const old = oldSlides.get(slide.id);
    const changed = previous && (!old || old.status !== slide.status);
    const knownDeletion = !previous && slide.status === "PLACEHOLDER";
    if (changed || knownDeletion) {
      changes.set(slide.id, { id: slide.id, kind: slide.status === "PLACEHOLDER" ? "DELETED" : "UPDATED", reviewed: false });
    }
  }
  return {
    schema: 1,
    snapshot,
    changes: snapshot.flatMap((slide) => changes.has(slide.id) ? [changes.get(slide.id)] : []),
  };
}

export function acknowledgeDocumentChange(record, slideId) {
  const id = String(slideId);
  const index = record.changes.findIndex((change) => change.id === id);
  if (index < 0 || record.changes[index].reviewed) return { record, nextId: null };
  const changes = record.changes.map((change) => change.id === id ? { ...change, reviewed: true } : change);
  const next = [...changes.slice(index + 1), ...changes.slice(0, index)].find((change) => !change.reviewed);
  return { record: { ...record, changes }, nextId: next?.id ?? null };
}

export function parseDocumentChanges(value) {
  try {
    const record = JSON.parse(value);
    if (record?.schema !== 1 || !Array.isArray(record.snapshot) || !Array.isArray(record.changes)) return null;
    if (!record.snapshot.every((slide) => typeof slide?.id === "string" && typeof slide.status === "string") ||
        !record.changes.every((change) => typeof change?.id === "string" &&
          ["DELETED", "UPDATED"].includes(change.kind) && typeof change.reviewed === "boolean")) return null;
    return record;
  } catch {
    // Old/corrupted browser data is not a valid comparison baseline.
    return null;
  }
}
