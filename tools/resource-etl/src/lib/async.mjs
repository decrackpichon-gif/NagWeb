export async function mapLimit(items, concurrency, worker) {
  const safeConcurrency = Math.max(1, Number(concurrency) || 1);
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(safeConcurrency, items.length || 1) },
      () => run()
    )
  );

  return results;
}
