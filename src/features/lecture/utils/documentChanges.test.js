import test from "node:test";
import assert from "node:assert/strict";
import { acknowledgeDocumentChange, parseDocumentChanges, reconcileDocumentChanges } from "./documentChanges.js";

const slide = (id, pageNumber, status = "ACTIVE") => ({ id, pageNumber, status });

test("first visit establishes a baseline; insertion does not mark renumbered pages", () => {
  const baseline = reconcileDocumentChanges(null, [slide("a", 1), slide("b", 2)]);
  assert.deepEqual(baseline.changes, []);
  const updated = reconcileDocumentChanges(baseline, [slide("a", 1), slide("new", 2), slide("b", 3)]);
  assert.deepEqual(updated.changes, [{ id: "new", kind: "UPDATED", reviewed: false }]);
});

test("placeholder and added pages are reviewed in current page order, then watermark disappears", () => {
  const baseline = reconcileDocumentChanges(null, [slide("a", 1), slide("b", 2)]);
  const slides = [slide("a", 1, "PLACEHOLDER"), slide("new", 2), slide("b", 3)];
  const updated = reconcileDocumentChanges(baseline, slides);
  assert.deepEqual(updated.changes.map((c) => c.kind), ["DELETED", "UPDATED"]);
  const first = acknowledgeDocumentChange(updated, "a");
  assert.equal(first.nextId, "new");
  const last = acknowledgeDocumentChange(first.record, "new");
  assert.equal(last.nextId, null);
  assert.equal(last.record.changes.some((c) => !c.reviewed), false);
  const reopened = reconcileDocumentChanges(parseDocumentChanges(JSON.stringify(last.record)), slides);
  assert.deepEqual(reopened.changes, []);
});

test("cancel/reload preserves pending reviews and checking out of order wraps to remaining changes", () => {
  const baseline = reconcileDocumentChanges(null, [slide("a", 1)]);
  const slides = [slide("a", 1, "PLACEHOLDER"), slide("b", 2), slide("c", 3)];
  const updated = reconcileDocumentChanges(baseline, slides);
  const reopened = reconcileDocumentChanges(parseDocumentChanges(JSON.stringify(updated)), slides);
  assert.deepEqual(reopened.changes, updated.changes);
  const result = acknowledgeDocumentChange(reopened, "c");
  assert.equal(result.nextId, "a");
  assert.equal(acknowledgeDocumentChange(result.record, "c").nextId, null);
});

test("new changes rearm reviewed pages without losing other pending reviews", () => {
  const baseline = reconcileDocumentChanges(null, [slide("a", 1), slide("b", 2)]);
  const updated = reconcileDocumentChanges(baseline, [slide("a", 1, "PLACEHOLDER"), slide("new", 2), slide("b", 3)]);
  const checked = acknowledgeDocumentChange(updated, "a").record;
  const next = reconcileDocumentChanges(checked, [slide("a", 1), slide("new", 2), slide("b", 3)]);
  assert.deepEqual(next.changes.map((c) => [c.id, c.reviewed]), [["a", false], ["new", false]]);
});

test("known deletions can be shown on first visit; vanished IDs are never navigation targets", () => {
  const baseline = reconcileDocumentChanges(null, [slide("deleted", 1, "PLACEHOLDER")]);
  assert.equal(baseline.changes[0].kind, "DELETED");
  assert.deepEqual(reconcileDocumentChanges(baseline, []).changes, []);
});

test("malformed or incompatible browser records are discarded", () => {
  for (const value of [null, "{", "{}", '{"schema":1,"snapshot":[null],"changes":[]}',
    '{"schema":1,"snapshot":[],"changes":[{"id":"x","kind":"OTHER","reviewed":false}]}']) {
    assert.equal(parseDocumentChanges(value), null);
  }
});
