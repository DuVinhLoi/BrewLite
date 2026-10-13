// Serialized snapshot transaction for InMemory repos (test/dev only).
// All impls share one registry so runInTransaction on ANY repo covers ALL
// repos, and one promise-chain mutex so concurrent tx bodies never interleave
// (a failing tx restoring a global snapshot would otherwise wipe a
// concurrent tx's committed writes and break the stock-never-negative test).
type SnapEntry = { snap(): Map<string, unknown>; restore(s: Map<string, unknown>): void };

const registry = new Set<SnapEntry>();

export function registerInMemoryRepo(entry: SnapEntry): void {
  registry.add(entry);
}

function snapshotAll() {
  return [...registry].map((r) => ({ r, s: r.snap() }));
}

let tail: Promise<void> = Promise.resolve();

export async function runInMemoryTransaction<T>(fn: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const prev = tail;
  tail = new Promise<void>((res) => (release = res));
  await prev;
  const snaps = snapshotAll();
  try {
    return await fn();
  } catch (e) {
    for (const { r, s } of snaps) r.restore(s);
    throw e;
  } finally {
    release();
  }
}

export function snapshotMap<T>(m: Map<string, T>): Map<string, unknown> {
  return new Map([...m].map(([k, v]) => [k, structuredClone(v)]));
}
