// Only the newest requested search may update the interface.
export function createLatestSearch(search, { onStart, onResult, onError, onFinish }) {
  let revision = 0;
  return {
    invalidate() { revision += 1; },
    async run(filters) {
      const current = ++revision;
      onStart();
      try {
        const result = await search(filters);
        if (current === revision) onResult(result);
      } catch (error) {
        if (current === revision) onError(error);
      } finally {
        if (current === revision) onFinish();
      }
    }
  };
}
