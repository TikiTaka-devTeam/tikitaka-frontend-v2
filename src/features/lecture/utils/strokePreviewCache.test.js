import test from "node:test";
import assert from "node:assert/strict";
import { rememberStrokePreview } from "./strokePreviewCache.js";

test("page previews isolate layers and never retain pending or deleted strokes", () => {
  const privateStroke = { id: "private", points: [{ x: 0.1, y: 0.2 }] };
  const sharedStroke = { id: "shared" };
  const original = new Map();
  const cache = rememberStrokePreview(original, "slide-a", [privateStroke, { id: "local-pending" }],
    [sharedStroke, { id: "deleted", isDeleted: true }]);
  assert.equal(original.size, 0);
  assert.deepEqual(cache.get("slide-a"), { privateStrokes: [privateStroke], sharedStrokes: [sharedStroke] });
  assert.equal(cache.get("slide-b"), undefined);
});

test("previews replace old page contents and evict the least recently stored page", () => {
  let cache = rememberStrokePreview(new Map(), "a", [], [], 2);
  cache = rememberStrokePreview(cache, "b", [], [], 2);
  cache = rememberStrokePreview(cache, "a", [{ id: "updated" }], [], 2);
  cache = rememberStrokePreview(cache, "c", [], [], 2);
  assert.deepEqual([...cache.keys()], ["a", "c"]);
  assert.deepEqual(cache.get("a").privateStrokes, [{ id: "updated" }]);
});
