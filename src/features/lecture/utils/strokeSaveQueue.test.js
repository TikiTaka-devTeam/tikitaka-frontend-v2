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

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test("idle CREATE sends without a timer; waiting strokes batch up to five and drain the tail", async () => {
  const queue = setup();
  const started = deferred();
  const firstResponse = deferred();
  const requests = [];
  const send = async (operations) => {
    requests.push(operations);
    if (requests.length === 1) {
      started.resolve();
      await firstResponse.promise;
    }
    return operations.map((operation) => `saved-${operation.id}`);
  };
  const add = (id) => queue.enqueueCreate("PRIVATE", {
    key: "slide", operation: { id }, send,
    task: async (response) => (await response).find((value) => value === `saved-${id}`),
  }, "doc");
  const results = [add(0)];
  await started.promise;
  for (let id = 1; id <= 12; id += 1) results.push(add(id));
  assert.equal(requests.length, 1);
  const waiting = queue.waitForPending("doc");
  firstResponse.resolve();
  await waiting;
  assert.deepEqual(requests.map((items) => items.length), [1, 5, 5, 2]);
  assert.deepEqual(await Promise.all(results), Array.from({ length: 13 }, (_, id) => `saved-${id}`));
  assert.deepEqual(requests.flat().map((item) => item.id), Array.from({ length: 13 }, (_, id) => id));
});

test("delete waits for CREATE mappings and separates subsequent CREATE batches", async () => {
  const queue = setup();
  const events = [];
  const mappings = new Map();
  const add = (id, key = "slide", scope = "doc", layer = "PRIVATE") => queue.enqueueCreate(layer, {
    key, operation: { id },
    send: async (operations) => {
      events.push(operations.map((item) => item.id));
      return operations;
    },
    task: async (response) => {
      await response;
      mappings.set(id, `server-${id}`);
      return mappings.get(id);
    },
  }, scope);
  add(1);
  add(2);
  queue.enqueue("PRIVATE", async () => {
    assert.equal(mappings.get(2), "server-2");
    events.push("delete-2");
  }, [], "doc");
  add(3);
  add(4, "other-slide");
  add(5, "other-slide", "other-doc");
  await queue.waitForPending("doc");
  assert.deepEqual(events, [[1, 2], "delete-2", [3], [4], [5]]);
});

test("failed CREATE batch retries the same operation IDs and preserves each result handler", async () => {
  const queue = setup();
  let online = false;
  const requests = [];
  const saved = [];
  const send = async (operations) => {
    requests.push(operations);
    if (!online) throw new Error("offline");
    return operations;
  };
  for (const id of ["uuid-1", "uuid-2"]) {
    queue.enqueueCreate("SHARED", {
      key: "slide", operation: { client_operation_id: id }, send,
      task: async (response) => { await response; saved.push(id); return id; },
    }, "doc");
  }
  await assert.rejects(queue.waitForPending("doc"), /offline/);
  online = true;
  await queue.waitForPending("doc", true);
  assert.deepEqual(requests[0], requests[1]);
  assert.deepEqual(saved, ["uuid-1", "uuid-2"]);
  assert.equal(requests.length, 2);
});
