// What it does: Deterministically stringifies JSON (sorted keys). Used before signing/verifying.
// Real-world role: Ensures signatures are stable across platforms/serializations so verifying the same payload always succeeds.

// Deterministic JSON stringify for signing/verifying.
export function stableStringify(obj: unknown): string {
  return JSON.stringify(sort(obj));
}

// Recursively sort object keys to make signatures stable across platforms.
function sort(value: any): any {
  if (Array.isArray(value)) return value.map(sort);
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    return Object.keys(value)
      .sort()
      .reduce((acc: any, k) => {
        acc[k] = sort(value[k]);
        return acc;
      }, {});
  }
  return value;
}