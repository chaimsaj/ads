/**
 * Generate valid 24-char hex strings for use as MongoDB ObjectIds in tests.
 * Each index produces a deterministic, unique ID.
 */
export function mockObjectId(index: number): string {
  return index.toString(16).padStart(24, '0');
}
