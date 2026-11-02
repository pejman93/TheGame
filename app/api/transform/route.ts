import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const BLOCKED = /\b(nude|naked|nsfw|sex|sexy|porn|lingerie|undress|gore|blood|kill|dead|corpse|nazi)\b/i;

/**
 * Turns an uploaded photo into a new image using the sender's prompt,
 * through OpenRouter. Returns { image: dataUrl }.
 */
export async function POST(req: Request) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "not_configured", message: "Photo transforms are not set up yet." },
      { status: 503 },
    );
  }

  let image = "";
  let prompt = "";
  try {
    const body = await req.json();
    image = String(body.image ?? "");
    prompt = String(body.prompt ?? "").trim().slice(0, 300);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 3_000_000) {
    return NextResponse.json({ error: "Send a JPEG/PNG/WebP photo under ~2MB" }, { status: 400 });
  }
  if (!prompt) return NextResponse.json({ error: "Write a prompt" }, { status: 400 });
  if (BLOCKED.test(prompt)) {
    return NextResponse.json(
      { error: "Let's keep it fun and friendly. Try a different prompt." },
      { status: 400 },
    );
  }

  const instruction =
    `Edit this photo for a fun birthday surprise. Request: "${prompt}". ` +
    "Keep the person's face recognizable. Keep it playful and wholesome: no nudity, " +
    "no gore, nothing hateful or humiliating. Return the edited image.";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-Title": "The Game",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error?.message ?? `Image service error (${res.status})`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    const out: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!out || !out.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "No image came back. Try rewording the prompt." },
        { status: 502 },
      );
    }
    return NextResponse.json({ image: out });
  } catch {
    return NextResponse.json({ error: "Could not reach the image service" }, { status: 502 });
  }
}
