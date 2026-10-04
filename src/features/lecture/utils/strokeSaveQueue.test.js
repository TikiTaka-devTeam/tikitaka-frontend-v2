import test from "node:test";
import assert from "node:assert/strict";
import { createStrokeSaveQueue } from "./strokeSaveQueue.js";

function setup() {
  const queues = { PRIVATE: { current: Promise.resolve() }, SHARED: { current: Promise.resolve() } };
  return createStrokeSaveQueue(queues);
}

test("download waits for saves in both layers and work appended during a save", async () => {
  const queue = setup();
  const events = [];
  let finish;
  queue.enqueue("PRIVATE", () => new Promise((resolve) => { finish = resolve; }), null, "doc");
  queue.enqueue("SHARED", async () => { events.push("shared"); }, null, "doc");
  const waiting = queue.waitForPending("doc").then(() => events.push("download"));
  await Promise.resolve();
  await Promise.resolve();
  queue.enqueue("PRIVATE", async () => { events.push("private"); }, null, "doc");
  assert.ok(!events.includes("download"));
  finish();
  await waiting;
  assert.equal(events.at(-1), "download");
  assert.ok(events.includes("private"));
  assert.ok(events.includes("shared"));
});

test("a failed save blocks download even after a later successful save", async () => {
  const queue = setup();
  const error = new Error("save failed");
  assert.equal(await queue.enqueue("PRIVATE", async () => { throw error; }, null, "doc"), null);
  await queue.enqueue("PRIVATE", async () => "saved", null, "doc");
  await assert.rejects(queue.waitForPending("doc"), error);
});

test("retry saves failed operations in order before allowing download", async () => {
  const queue = setup();
  let online = false;
  let created = false;
  let attempts = 0;
  await queue.enqueue("PRIVATE", async () => {
    attempts += 1;
    if (!online) throw new Error("offline");
    created = true;
  }, null, "doc");
  await queue.enqueue("PRIVATE", async () => {
    if (!created) throw new Error("creation pending");
    created = false;
  }, [], "doc");
  await assert.rejects(queue.waitForPending("doc"));
  online = true;
  await queue.waitForPending("doc", true);
  assert.equal(created, false);
  assert.equal(attempts, 2);
  await queue.waitForPending("doc");
  assert.equal(attempts, 2);
});

test("retry failure continues to block download and stops subsequent edits", async () => {
  const queue = setup();
  let laterAttempts = 0;
  await queue.enqueue("SHARED", async () => { throw new Error("offline"); }, null, "doc");
  await queue.enqueue("SHARED", async () => { laterAttempts += 1; throw new Error("offline"); }, [], "doc");
  await assert.rejects(queue.waitForPending("doc", true));
  assert.equal(laterAttempts, 1);
});

test("failed saves from another document do not block or get retried", async () => {
  const queue = setup();
  let attempts = 0;
  await queue.enqueue("PRIVATE", async () => { attempts += 1; throw new Error("offline"); }, null, "previous");
  await queue.waitForPending("current", true);
  assert.equal(attempts, 1);
});
