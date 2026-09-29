import { normalizeStroke } from "./lectureData.js";

export function sortStrokes(strokes) {
  return [...strokes].sort((a, b) =>
    a.strokeOrder - b.strokeOrder || String(a.id).localeCompare(String(b.id)),
  );
}

// NTE-003 is the snapshot; only NTE-010 SYNCED events advance its version.
export function createSharedStrokeSync({ slideId, spaceId, fetchSnapshot, onChange, onError }) {
  let version = 0;
  let permanent = new Map();
  const temporary = new Map();
  const completed = new Map();
  let buffer = [];
  let initializing = true;
  let disposed = false;
  let refreshTask = null;
  let retryTimer = null;
  let generation = 0;

  function emit() {
    if (!disposed) onChange({
      version,
      strokes: sortStrokes(permanent.values()),
      liveStrokes: sortStrokes([...temporary.values()].map((entry) => entry.stroke)),
      completed: new Set(completed.keys()),
    });
  }

  function markCompleted(items) {
    for (const item of items) {
      if (!item.client_stroke_id) continue;
      completed.set(item.client_stroke_id, Date.now());
      temporary.delete(item.client_stroke_id);
    }
  }

  function apply(event) {
    const id = event.client_stroke_id;
    if (event.type === "SHARED_STROKES_SYNCED") {
      markCompleted(event.created_strokes ?? []);
      if (event.version <= version) return true;
      if (event.version !== version + 1) return false;
      for (const deletedId of event.deleted_stroke_ids ?? []) permanent.delete(deletedId);
      for (const item of event.created_strokes ?? []) {
        permanent.set(item.stroke_id, normalizeStroke(item));
      }
      version = event.version;
      return true;
    }
    if (!id || completed.has(id)) return true;
    const existing = temporary.get(id);
    if (event.type === "STROKE_START" && !existing) {
      temporary.set(id, {
        stroke: normalizeStroke({ ...event, stroke_id: `live-${id}`, points: [event.point] }),
        chunk: 0, ended: false, updated: Date.now(),
      });
    } else if (event.type === "STROKE_POINTS" && existing && !existing.ended) {
      if (event.chunk_seq !== existing.chunk + 1) return true;
      existing.stroke = {
        ...existing.stroke,
        points: [...existing.stroke.points, ...event.points.map((p) => ({ x: p.x_ratio, y: p.y_ratio }))],
      };
      existing.chunk = event.chunk_seq;
      existing.updated = Date.now();
    } else if (event.type === "STROKE_END" && existing) {
      existing.ended = true;
      existing.updated = Date.now();
    } else if (event.type === "STROKE_CANCEL") {
      temporary.delete(id);
    }
    return true;
  }

  function receive(event) {
    if (disposed || String(event.slide_id) !== String(slideId) ||
        String(event.space_id) !== String(spaceId)) return;
    if (initializing) {
      buffer.push(event);
      return;
    }
    if (!apply(event)) {
      buffer.push(event);
      void refresh();
    }
    emit();
  }

  function refresh() {
    if (disposed) return Promise.resolve();
    if (refreshTask) return refreshTask;
    clearTimeout(retryTimer);
    initializing = true;
    temporary.clear();
    emit();
    refreshTask = (async () => {
      // Retry a fresh snapshot if events reveal another gap during recovery.
      for (let attempt = 0; attempt < 3 && !disposed; attempt += 1) {
        const requestGeneration = generation;
        const snapshot = await fetchSnapshot();
        if (disposed) return;
        if (requestGeneration !== generation) continue;
        version = Number(snapshot.version);
        permanent = new Map((snapshot.strokes ?? []).map((s) => [s.stroke_id, normalizeStroke(s)]));
        temporary.clear();
        const events = buffer;
        buffer = [];
        const saved = events.filter((e) => e.type === "SHARED_STROKES_SYNCED")
          .sort((a, b) => a.version - b.version);
        let gap = false;
        for (let i = 0; i < saved.length; i += 1) {
          if (!apply(saved[i])) {
            buffer.push(...saved.slice(i), ...events.filter((e) => e.type !== "SHARED_STROKES_SYNCED"));
            gap = true;
            break;
          }
        }
        if (gap) continue;
        for (const event of events) {
          if (event.type !== "SHARED_STROKES_SYNCED") apply(event);
        }
        initializing = false;
        emit();
        return;
      }
      if (!disposed) throw new Error("공유 필기 상태를 다시 동기화하지 못했습니다.");
    })().catch((error) => {
      if (!disposed) {
        onError(error);
        retryTimer = setTimeout(() => void refresh(), 3000);
      }
    }).finally(() => { refreshTask = null; });
    return refreshTask;
  }

  function reconnect() {
    generation += 1;
    initializing = true;
    buffer = [];
    temporary.clear();
    return refresh();
  }

  function acceptSaved(response, created = [], deleted = []) {
    receive({
      type: "SHARED_STROKES_SYNCED", slide_id: slideId, space_id: spaceId,
      version: response.version, created_strokes: created, deleted_stroke_ids: deleted,
    });
  }

  const expiryTimer = setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, entry] of temporary) {
      if (now - entry.updated > 30000) { temporary.delete(id); changed = true; }
    }
    for (const [id, time] of completed) {
      if (now - time > 60000) completed.delete(id);
    }
    if (changed) emit();
  }, 5000);

  return {
    receive, refresh, reconnect, acceptSaved,
    isReady: () => !initializing && !disposed,
    dispose() {
      disposed = true;
      clearInterval(expiryTimer);
      clearTimeout(retryTimer);
      buffer = [];
    },
  };
}

// Collect pointer samples for 32 ms, preserving their order and the CREATE UUID.
export function createLiveStrokeSender(send) {
  const drafts = new Map();
  function flush(entry) {
    clearTimeout(entry.timer);
    entry.timer = null;
    if (!entry.points.length) return;
    if (!send({ type: "STROKE_POINTS", client_stroke_id: entry.id,
      chunk_seq: ++entry.chunk, points: entry.points.splice(0) })) {
      entry.disconnected = true;
    }
  }
  return {
    update(stroke) {
      const id = stroke.clientStrokeId;
      let entry = drafts.get(id);
      if (!entry) {
        const sent = send({ type: "STROKE_START", client_stroke_id: id,
          tool: stroke.tool, color: stroke.color, thickness: stroke.thickness,
          opacity: stroke.opacity, stroke_order: stroke.strokeOrder,
          point: { x_ratio: stroke.points[0].x, y_ratio: stroke.points[0].y } });
        entry = { id, chunk: 0, count: 1, points: [], timer: null, disconnected: !sent, ended: false };
        drafts.set(id, entry);
      }
      if (entry.disconnected || entry.ended) return;
      entry.points.push(...stroke.points.slice(entry.count).map((p) => ({ x_ratio: p.x, y_ratio: p.y })));
      entry.count = stroke.points.length;
      if (entry.points.length && !entry.timer) entry.timer = setTimeout(() => flush(entry), 32);
    },
    end(id) {
      const entry = drafts.get(id);
      if (!entry || entry.ended || entry.disconnected) return;
      flush(entry);
      if (!entry.disconnected) send({ type: "STROKE_END", client_stroke_id: id, last_chunk_seq: entry.chunk });
      entry.ended = true;
    },
    cancel(id) {
      const entry = drafts.get(id);
      if (!entry) return;
      clearTimeout(entry.timer);
      if (!entry.disconnected) send({ type: "STROKE_CANCEL", client_stroke_id: id });
      drafts.delete(id);
    },
    saved(id) {
      clearTimeout(drafts.get(id)?.timer);
      drafts.delete(id);
    },
    reset() {
      for (const entry of drafts.values()) {
        clearTimeout(entry.timer);
        entry.disconnected = true;
      }
    },
    dispose() {
      for (const entry of drafts.values()) {
        clearTimeout(entry.timer);
        if (!entry.ended && !entry.disconnected) send({ type: "STROKE_CANCEL", client_stroke_id: entry.id });
      }
      drafts.clear();
    },
  };
}
