import { promises as fs } from "fs";
import path from "path";

/** Root directory where entry images are stored, organized by entry id. */
export const uploadsRoot = path.join(process.cwd(), "uploads");

/** Absolute directory holding the images for a single library entry. */
export function entryUploadDir(id: number | string) {
  return path.join(uploadsRoot, String(id));
}

/**
 * Persist the images used to scan an entry into `uploads/<id>/`.
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
