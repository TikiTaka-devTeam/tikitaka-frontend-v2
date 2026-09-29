import test from "node:test";
import assert from "node:assert/strict";
import { createSharedStrokeSync, createLiveStrokeSender } from "./sharedStrokeSync.js";

const point = { x_ratio: 0.1, y_ratio: 0.2 };
const saved = (id, clientId = id) => ({
  stroke_id: id, client_stroke_id: clientId, tool: "PEN", points: [point],
  color: "#212326", thickness: 0.0045, opacity: 1, stroke_order: 1,
});
const event = (type, fields = {}) => ({
  type, slide_id: "slide", space_id: "space", ...fields,
});
function harness(t, fetchSnapshot = async () => ({ version: 0, strokes: [] })) {
  const states = [];
  const errors = [];
  const sync = createSharedStrokeSync({
    slideId: "slide", spaceId: "space", fetchSnapshot,
    onChange: (value) => states.push(value), onError: (error) => errors.push(error),
  });
  t.after(() => sync.dispose());
  return { sync, states, errors, latest: () => states.at(-1) };
}

test("live strokes do not advance version; saved and deleted events do", async (t) => {
  const h = harness(t);
  await h.sync.refresh();
  h.sync.receive(event("STROKE_START", { client_stroke_id: "c", point, tool: "PEN" }));
  h.sync.receive(event("STROKE_POINTS", { client_stroke_id: "c", chunk_seq: 1, points: [point] }));
  assert.equal(h.latest().version, 0);
  assert.equal(h.latest().liveStrokes[0].points.length, 2);
  h.sync.receive(event("SHARED_STROKES_SYNCED", { version: 1, created_strokes: [saved("s", "c")] }));
  assert.equal(h.latest().liveStrokes.length, 0);
  assert.equal(h.latest().strokes[0].id, "s");
  h.sync.receive(event("SHARED_STROKES_SYNCED", { version: 2, deleted_stroke_ids: ["s"] }));
  assert.equal(h.latest().strokes.length, 0);
  assert.equal(h.latest().version, 2);
});

test("REST and socket completion in either order never duplicate or resurrect a stroke", async (t) => {
  for (const restFirst of [true, false]) {
    const h = harness(t);
    await h.sync.refresh();
    const rest = () => h.sync.acceptSaved({ version: 1 }, [saved("s", "c")]);
    const socket = () => h.sync.receive(event("SHARED_STROKES_SYNCED", { version: 1, created_strokes: [saved("s", "c")] }));
    if (restFirst) { rest(); socket(); } else { socket(); rest(); }
    assert.equal(h.latest().strokes.length, 1);
    h.sync.receive(event("STROKE_START", { client_stroke_id: "c", point }));
    h.sync.receive(event("STROKE_CANCEL", { client_stroke_id: "c" }));
    assert.equal(h.latest().liveStrokes.length, 0);
    assert.equal(h.latest().strokes.length, 1);
    h.sync.receive(event("SHARED_STROKES_SYNCED", { version: 2, deleted_stroke_ids: ["s"] }));
    rest();
    assert.equal(h.latest().strokes.length, 0);
  }
});

test("snapshot buffers out-of-order versions and ignores completed late live frames", async (t) => {
  let resolve;
  const h = harness(t, () => new Promise((done) => { resolve = done; }));
  const loading = h.sync.refresh();
  h.sync.receive(event("SHARED_STROKES_SYNCED", { version: 2, created_strokes: [saved("b")] }));
  h.sync.receive(event("SHARED_STROKES_SYNCED", { version: 1, created_strokes: [saved("a")] }));
  h.sync.receive(event("STROKE_START", { client_stroke_id: "a", point }));
  resolve({ version: 0, strokes: [] });
  await loading;
  assert.equal(h.latest().version, 2);
  assert.equal(h.latest().strokes.length, 2);
  assert.equal(h.latest().liveStrokes.length, 0);
});

test("version gap reloads the snapshot and clears temporary strokes", async (t) => {
  let calls = 0;
  const h = harness(t, async () => ++calls === 1
    ? { version: 0, strokes: [] } : { version: 3, strokes: [saved("fresh")] });
  await h.sync.refresh();
  h.sync.receive(event("STROKE_START", { client_stroke_id: "old", point }));
  h.sync.receive(event("SHARED_STROKES_SYNCED", { version: 3, created_strokes: [saved("fresh")] }));
  await h.sync.refresh();
  assert.equal(calls, 2);
  assert.equal(h.latest().version, 3);
  assert.equal(h.latest().liveStrokes.length, 0);
  assert.deepEqual(h.latest().strokes.map((s) => s.id), ["fresh"]);
});

test("other-slide events and responses after disposal cannot change the visible layer", async (t) => {
  let resolve;
  const h = harness(t, () => new Promise((done) => { resolve = done; }));
  const loading = h.sync.refresh();
  h.sync.receive(event("SHARED_STROKES_SYNCED", { slide_id: "other", version: 1, created_strokes: [saved("wrong")] }));
  h.sync.dispose();
  const count = h.states.length;
  resolve({ version: 1, strokes: [saved("late")] });
  await loading;
  assert.equal(h.states.length, count);
});

test("reconnect during an old snapshot fetch discards the old snapshot", async (t) => {
  let resolve;
  let calls = 0;
  const h = harness(t, () => ++calls === 1
    ? new Promise((done) => { resolve = done; })
    : Promise.resolve({ version: 4, strokes: [saved("fresh")] }));
  const loading = h.sync.refresh();
  h.sync.reconnect();
  resolve({ version: 1, strokes: [saved("stale")] });
  await loading;
  assert.equal(h.latest().version, 4);
  assert.deepEqual(h.latest().strokes.map((s) => s.id), ["fresh"]);
});

test("points without START are ignored; repeated chunks are not duplicated", async (t) => {
  const h = harness(t);
  await h.sync.refresh();
  const points = event("STROKE_POINTS", { client_stroke_id: "c", chunk_seq: 1, points: [point] });
  h.sync.receive(points);
  assert.equal(h.latest().liveStrokes.length, 0);
  h.sync.receive(event("STROKE_START", { client_stroke_id: "c", point }));
  h.sync.receive(points);
  h.sync.receive(points);
  assert.equal(h.latest().liveStrokes[0].points.length, 2);
});

const draft = () => ({ clientStrokeId: "c", tool: "PEN", color: "#212326",
  thickness: 0.0045, opacity: 1, strokeOrder: 1, points: [{ x: 0.1, y: 0.2 }] });

test("live sender batches samples in snake_case and flushes before END", (t) => {
  const frames = [];
  const sender = createLiveStrokeSender((frame) => { frames.push(frame); return true; });
  t.after(() => sender.dispose());
  const stroke = draft();
  sender.update(stroke);
  stroke.points.push({ x: 0.2, y: 0.3 });
  sender.update(stroke);
  stroke.points.push({ x: 0.3, y: 0.4 });
  sender.update(stroke);
  assert.equal(frames.length, 1);
  sender.end("c");
  assert.deepEqual(frames.map((f) => f.type), ["STROKE_START", "STROKE_POINTS", "STROKE_END"]);
  assert.equal(frames[1].points.length, 2);
  assert.equal(frames[1].chunk_seq, 1);
  assert.equal(frames[2].last_chunk_seq, 1);
  assert.deepEqual(frames[0].point, point);
  sender.saved("c");
  sender.cancel("c");
  assert.equal(frames.length, 3);
});

test("disconnect never replays old draft frames; failure can cancel an ended stroke", (t) => {
  const frames = [];
  const sender = createLiveStrokeSender((f) => { frames.push(f); return true; });
  t.after(() => sender.dispose());
  const stroke = draft();
  sender.update(stroke);
  sender.end("c");
  assert.equal(frames[1].last_chunk_seq, 0);
  sender.cancel("c");
  assert.equal(frames[2].type, "STROKE_CANCEL");
  stroke.clientStrokeId = "next";
  sender.update(stroke);
  sender.reset();
  const count = frames.length;
  stroke.points.push({ x: 0.4, y: 0.5 });
  sender.update(stroke);
  sender.end("next");
  assert.equal(frames.length, count);
});
