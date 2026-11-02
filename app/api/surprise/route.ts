import { NextResponse } from "next/server";
import { saveFile } from "@/lib/storage";
import { newId } from "@/lib/ids";
import { parseSurpriseInput } from "@/lib/validate";
import type { SurpriseConfig } from "@/lib/types";

export const runtime = "nodejs";

/** Save a finished surprise and return its id. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseSurpriseInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const config: SurpriseConfig = {
    v: 1,
    id: newId(12),
    createdAt: new Date().toISOString(),
    ...parsed.value,
  };
  try {
    await saveFile(`surprises/${config.id}.json`, JSON.stringify(config), "application/json");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  return NextResponse.json({ id: config.id });
}
