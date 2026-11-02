import { readLocalFile, usingBlob } from "@/lib/storage";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  wav: "audio/wav",
};

/** Serves locally stored media during development (Vercel Blob serves it in production). */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const joined = key.join("/");
  if (usingBlob() || !joined.startsWith("media/")) return new Response("Not found", { status: 404 });
  let data: Buffer | null = null;
  try {
    data = await readLocalFile(joined);
  } catch {
    data = null;
  }
  if (!data) return new Response("Not found", { status: 404 });
  const ext = joined.split(".").pop() ?? "";
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": TYPES[ext] ?? "application/octet-stream",
      "cache-control": "public, max-age=3600",
    },
  });
}
