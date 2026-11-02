import "server-only";
import { put, head } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

/**
 * Storage for uploaded media and saved surprises.
 * - On Vercel (or anywhere BLOB_READ_WRITE_TOKEN is set) files go to Vercel Blob.
 * - Otherwise they are written to ./.data and served by /api/media (local dev only).
 */

const LOCAL_ROOT = path.join(process.cwd(), ".data");
export const KEY_PATTERN = /^(media|surprises)\/[A-Za-z0-9_-]+\.(jpg|png|webp|wav|json)$/;

export function usingBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function assertKey(key: string) {
  if (!KEY_PATTERN.test(key)) throw new Error("Invalid storage key");
}

export async function saveFile(
  key: string,
  data: Buffer | string,
  contentType: string,
): Promise<string> {
  assertKey(key);
  if (usingBlob()) {
    const blob = await put(key, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });
    return blob.url;
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Storage is not configured. Connect a Vercel Blob store to this project.",
    );
  }
  const file = path.join(LOCAL_ROOT, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
  return `/api/media/${key}`;
}

export async function readJson<T>(key: string): Promise<T | null> {
  assertKey(key);
  try {
    if (usingBlob()) {
      const meta = await head(key);
      const res = await fetch(meta.url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as T;
    }
    const raw = await fs.readFile(path.join(LOCAL_ROOT, key), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function readLocalFile(key: string): Promise<Buffer | null> {
  assertKey(key);
  try {
    return await fs.readFile(path.join(LOCAL_ROOT, key));
  } catch {
    return null;
  }
}

/** Only media we stored ourselves may be referenced by a surprise. */
export function isOwnMediaUrl(url: string): boolean {
  if (/^\/api\/media\/media\/[A-Za-z0-9_-]+\.(jpg|png|webp|wav)$/.test(url)) return true;
  return /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/media\/[A-Za-z0-9_-]+\.(jpg|png|webp|wav)$/i.test(
    url,
  );
}
