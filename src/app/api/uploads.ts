import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

/** Root directory where entry images are stored, organized by entry id. */
export const uploadsRoot = path.join(process.cwd(), "uploads");

/**
 * Holding area for images received during scanning, before an entry id has
 * been assigned. Kept inside `uploadsRoot` so promoting a batch to an entry is
 * a same-filesystem directory rename rather than a copy.
 */
export const tempUploadsRoot = path.join(uploadsRoot, ".tmp");

/** Absolute directory holding the images for a single library entry. */
export function entryUploadDir(id: number | string) {
  return path.join(uploadsRoot, String(id));
}

/** Only accept tokens shaped like the UUIDs we generate (no path traversal). */
function isValidToken(token: string): boolean {
  return /^[a-f0-9-]{36}$/i.test(token);
}

function tempBatchDir(token: string) {
  return path.join(tempUploadsRoot, token);
}

/**
 * Persist the original scanned images into a temporary batch directory and
 * return a token the client can later exchange for a permanent entry folder.
 * Originals are stored as-is (the resized copies are only used for analysis).
 */
export async function saveTempBatch(files: File[]): Promise<string> {
  const token = randomUUID();
  const dir = tempBatchDir(token);
  await fs.mkdir(dir, { recursive: true });

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const name = `${String(index).padStart(3, "0")}${ext}`;
    await fs.writeFile(path.join(dir, name), buffer);
  }

  return token;
}

/**
 * Write an OpenAI analysis JSON alongside the scanned images in the temp batch,
 * so it travels with them when the batch is promoted to an entry. A batch may be
 * analyzed more than once, so responses are numbered sequentially
 * (`response-000.json`, `response-001.json`, …). Returns the saved file name.
 */
export async function saveTempBatchResponse(
  token: string,
  data: unknown,
): Promise<string | null> {
  if (!token || !isValidToken(token)) return null;

  const dir = tempBatchDir(token);
  await fs.mkdir(dir, { recursive: true });

  let existing: string[] = [];
  try {
    existing = await fs.readdir(dir);
  } catch {
    // directory was just created; no prior responses
  }
  const next = existing.filter((name) =>
    /^response-\d+\.json$/.test(name),
  ).length;

  const name = `response-${String(next).padStart(3, "0")}.json`;
  await fs.writeFile(path.join(dir, name), JSON.stringify(data, null, 2));
  return name;
}

/**
 * Promote a previously saved temp batch to `uploads/<id>/` by renaming the
 * directory. Returns the saved file names, or [] when the token is unknown,
 * invalid, or already consumed.
 */
export async function moveTempBatchToEntry(
  token: string,
  id: number,
): Promise<string[]> {
  if (!token || !isValidToken(token)) return [];

  const tempDir = tempBatchDir(token);
  try {
    const names = await fs.readdir(tempDir);
    if (names.length === 0) {
      await fs.rm(tempDir, { recursive: true, force: true });
      return [];
    }
    await fs.mkdir(uploadsRoot, { recursive: true });
    await fs.rename(tempDir, entryUploadDir(id));
    return names.sort();
  } catch {
    return [];
  }
}

/** Delete temp batches older than maxAgeMs (scans that were never selected). */
export async function cleanupStaleTempBatches(maxAgeMs: number): Promise<void> {
  let entries: string[];
  try {
    entries = await fs.readdir(tempUploadsRoot);
  } catch {
    return; // nothing to clean up yet
  }

  const now = Date.now();
  await Promise.all(
    entries.map(async (name) => {
      const dir = path.join(tempUploadsRoot, name);
      try {
        const stat = await fs.stat(dir);
        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.rm(dir, { recursive: true, force: true });
        }
      } catch {
        // ignore failures on individual batches
      }
    }),
  );
}

/**
 * Persist images directly into `uploads/<id>/` (used when files are uploaded
 * together with the entry rather than promoted from a scan batch).
 * Files are written with index-based names to avoid path traversal and
 * collisions. Returns the saved file names.
 */
export async function saveEntryImages(id: number, files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  const dir = entryUploadDir(id);
  await fs.mkdir(dir, { recursive: true });

  const saved: string[] = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const name = `${String(index).padStart(3, "0")}${ext}`;
    await fs.writeFile(path.join(dir, name), buffer);
    saved.push(name);
  }

  return saved;
}
