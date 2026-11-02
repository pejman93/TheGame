import { NextResponse } from "next/server";
import { saveFile } from "@/lib/storage";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "audio/wav": "wav",
};
const MAX_BYTES = 4 * 1024 * 1024;

/** Upload one photo or voice clip as the raw request body. */
export async function POST(req: Request) {
  const type = (req.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = TYPES[type];
  if (!ext) return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });

  const data = Buffer.from(await req.arrayBuffer());
  if (data.length === 0) return NextResponse.json({ error: "Empty file" }, { status: 400 });
  if (data.length > MAX_BYTES) return NextResponse.json({ error: "File too large" }, { status: 413 });

  try {
    const url = await saveFile(`media/${newId(16)}.${ext}`, data, type);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
