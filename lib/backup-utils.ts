export type BackupEnvelope = {
  version: number;
  createdAt?: string;
  data?: Record<string, unknown>;
};

export function isValidBackupEnvelope(value: unknown): value is BackupEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as BackupEnvelope;
  return candidate.version === 1 && Boolean(candidate.data) && typeof candidate.data === "object";
}

export function extractBackupPairs(
  data: Record<string, unknown> | undefined,
  allowedKeys: readonly string[],
): [string, string][] {
  if (!data) return [];
  return Object.entries(data).filter(
    (entry): entry is [string, string] => allowedKeys.includes(entry[0]) && typeof entry[1] === "string",
  );
}

export function shouldAbortRestore(pairs: readonly [string, string][]): boolean {
  return pairs.length === 0;
}
