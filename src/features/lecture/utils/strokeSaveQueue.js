// Keep failed saves observable even when drawing handlers recover with a fallback.
export function createStrokeSaveQueue(queues) {
  const failedTasks = new Map();

  function enqueue(layer, task, fallback, scope) {
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

  return { enqueue, waitForPending };
}
