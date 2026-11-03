// Keep failed saves observable even when drawing handlers recover with a fallback.
export function createStrokeSaveQueue(queues) {
  const failedTasks = new Map();
  const openBatches = new Map();

  function enqueue(layer, task, fallback, scope) {
    // Deletes and other ordinary tasks are ordering barriers for CREATE batches.
    openBatches.delete(layer);
    const queue = queues[layer];
    const pending = queue.current.catch(() => undefined).then(task).then(
      (result) => {
        failedTasks.delete(task);
        return result;
      },
      (error) => {
        failedTasks.set(task, { layer, fallback, scope, error });
        throw error;
      },
    );
    queue.current = pending;
    return pending.catch(() => fallback);
  }

  function enqueueCreate(layer, { key, operation, send, task }, scope) {
    let batch = openBatches.get(layer);
    if (!batch || batch.key !== key || batch.scope !== scope || batch.entries.length >= 5) {
      batch = { key, scope, entries: [] };
      const currentBatch = batch;
      batch.completion = enqueue(layer, async () => {
        if (openBatches.get(layer) === currentBatch) openBatches.delete(layer);
        // No timer: the next request takes only work already waiting in the queue.
        // Keep this exact operation set (and IDs) intact when retrying a failure.
        const response = Promise.resolve().then(() => send(currentBatch.entries.map((entry) => entry.operation)));
        const results = await Promise.allSettled(currentBatch.entries.map((entry) => entry.task(response)));
        const failure = results.find((result) => result.status === "rejected");
        if (failure) throw failure.reason;
        return results.map((result) => result.value);
      }, null, scope);
      openBatches.set(layer, batch);
    }
    const index = batch.entries.length;
    batch.entries.push({ operation, task });
    return batch.completion.then((results) => results ? results[index] : null);
  }

  async function waitForPending(scope, retryFailed = false) {
    // Drain both queues, including work appended while a previous save completes.
    async function drain() {
      let pending;
      do {
        pending = Object.values(queues).map((queue) => queue.current);
        await Promise.allSettled(pending);
      } while (Object.values(queues).some((queue, index) => queue.current !== pending[index]));
    }

    await drain();
    if (retryFailed) {
      for (const [task, entry] of [...failedTasks]) {
        if (entry.scope !== scope) continue;
        await enqueue(entry.layer, task, entry.fallback, scope);
        // Preserve operation order: later failed edits must wait for this save.
        if (failedTasks.has(task)) break;
      }
      await drain();
    }

    const failure = [...failedTasks.values()].find((entry) => entry.scope === scope);
    if (failure) throw failure.error;
  }

  return { enqueue, enqueueCreate, waitForPending };
}
