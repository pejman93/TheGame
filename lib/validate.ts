import { getGame } from "./games";
import { isOwnMediaUrl } from "./storage";
import type { SurpriseInput } from "./types";

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Validates and normalizes untrusted input from the create page. */
export function parseSurpriseInput(
  body: unknown,
): { ok: true; value: SurpriseInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request" };
  const b = body as Record<string, unknown>;

  const game = getGame(str(b.game, 40));
  if (!game || !game.available) return { ok: false, error: "Unknown game" };

  const recipientName = str(b.recipientName, 40);
  const senderName = str(b.senderName, 40);
  const message = str(b.message, 800);
  if (!recipientName) return { ok: false, error: "Add the birthday person's name" };
  if (!senderName) return { ok: false, error: "Add your name" };
  if (!message) return { ok: false, error: "Add a birthday message" };

  let age: number | undefined;
  if (b.age !== undefined && b.age !== null && b.age !== "") {
    const n = Number(b.age);
    if (!Number.isInteger(n) || n < 1 || n > 120) return { ok: false, error: "Age looks wrong" };
    age = n;
  }

  const jokes = Array.isArray(b.jokes)
    ? b.jokes.map((j) => str(j, 120)).filter(Boolean).slice(0, 3)
    : [];

  const photos = Array.isArray(b.photos)
    ? b.photos
        .map((p) => str((p as { url?: unknown })?.url, 300))
        .filter((u) => u && isOwnMediaUrl(u))
        .slice(0, 3)
        .map((url) => ({ url }))
    : [];

  const v = (b.voice ?? {}) as Record<string, unknown>;
  const voice: SurpriseInput["voice"] = {};
  const main = str(v.main, 300);
  const creepy = str(v.creepy, 300);
  if (main && isOwnMediaUrl(main)) voice.main = main;
  if (creepy && isOwnMediaUrl(creepy)) voice.creepy = creepy;

  let unlockAt: string | undefined;
  const u = str(b.unlockAt, 40);
  if (u) {
    const t = Date.parse(u);
    if (Number.isNaN(t)) return { ok: false, error: "Unlock date looks wrong" };
    unlockAt = new Date(t).toISOString();
  }

  return {
    ok: true,
    value: { game: game.id, recipientName, senderName, age, message, jokes, photos, voice, unlockAt },
  };
}
