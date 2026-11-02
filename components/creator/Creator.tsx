"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { AudioEngine } from "@/lib/client/audio-engine";
import { dataUrlToBlob, resizeImage } from "@/lib/client/image";
import type { GameInfo } from "@/lib/games";
import type { SurpriseInput } from "@/lib/types";
import { PhotoSlot, type PhotoValue } from "./PhotoSlot";
import { VoiceRecorder } from "./VoiceRecorder";

async function upload(blob: Blob): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "content-type": blob.type },
    body: blob,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}

export function Creator({ game }: { game: GameInfo }) {
  const engine = useRef<AudioEngine | null>(null);
  if (!engine.current) engine.current = new AudioEngine();

  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [age, setAge] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [jokes, setJokes] = useState(["", "", ""]);
  const [photos, setPhotos] = useState<(PhotoValue | null)[]>([null, null, null]);
  const [mainVoice, setMainVoice] = useState<Blob | null>(null);
  const [creepyVoice, setCreepyVoice] = useState<Blob | null>(null);
  const [message, setMessage] = useState("");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!recipientName.trim() || !senderName.trim() || !message.trim()) {
      setError("Please fill in both names and the birthday message.");
      return;
    }
    setBusy(true);
    try {
      const photoUrls: { url: string }[] = [];
      const chosen = photos.filter((p): p is PhotoValue => Boolean(p));
      for (let i = 0; i < chosen.length; i++) {
        setStatus(`Uploading photo ${i + 1} of ${chosen.length}…`);
        const p = chosen[i];
        const blob =
          p.useGenerated && p.generated ? await resizeImage(await dataUrlToBlob(p.generated)) : p.original;
        photoUrls.push({ url: await upload(blob) });
      }
      const voice: SurpriseInput["voice"] = {};
      if (mainVoice) {
        setStatus("Uploading your voice…");
        voice.main = await upload(mainVoice);
      }
      if (creepyVoice) {
        setStatus("Uploading the creepy line…");
        voice.creepy = await upload(creepyVoice);
      }
      setStatus("Wrapping it up…");
      const body: SurpriseInput = {
        game: game.id,
        recipientName,
        senderName,
        age: age ? Number(age) : undefined,
        message,
        jokes: jokes.filter((j) => j.trim()),
        photos: photoUrls,
        voice,
        // Unlock at local midnight on the chosen day.
        unlockAt: unlockDate ? new Date(`${unlockDate}T00:00:00`).toISOString() : undefined,
      };
      const res = await fetch("/api/surprise", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.id) throw new Error(data.error ?? "Could not save your surprise");
      setResultId(data.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    }
    setStatus("");
    setBusy(false);
  }

  if (resultId) {
    const link = `${window.location.origin}/play/${resultId}`;
    return (
      <div className="create-done card">
        <div className="big-emoji">🎉</div>
        <h1>Your trap is set.</h1>
        <p>
          Send this link to <strong>{recipientName}</strong>. Don&apos;t tell them what it is. 😈
        </p>
        <div className="link-box">
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <button
            className="btn btn-primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* ignore */
              }
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="row center">
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button className="btn btn-ghost" onClick={() => navigator.share({ url: link }).catch(() => {})}>
              Share…
            </button>
          )}
          <a className="btn btn-ghost" href={`/play/${resultId}?preview=1`} target="_blank" rel="noreferrer">
            Preview it yourself
          </a>
        </div>
        <p className="note">
          Tip: your preview link skips the countdown lock. The real link above keeps it.
        </p>
        <Link href="/" className="make-one">
          Make another one →
        </Link>
      </div>
    );
  }

  return (
    <form className="creator" onSubmit={submit}>
      <header className="creator-head">
        <Link href="/" className="back">
          ← All games
        </Link>
        <div className="game-badge">
          <span aria-hidden>{game.emoji}</span> {game.title}
        </div>
        <p className="muted">{game.trick}</p>
        {game.tip && <p className="tip">💡 {game.tip}</p>}
      </header>

      <section className="card">
        <h2>1. Who&apos;s the birthday person?</h2>
        <div className="grid2">
          <label className="field">
            <span className="field-label">Their name *</span>
            <input value={recipientName} maxLength={40} onChange={(e) => setRecipientName(e.target.value)} placeholder="Sara" required />
          </label>
          <label className="field">
            <span className="field-label">Your name *</span>
            <input value={senderName} maxLength={40} onChange={(e) => setSenderName(e.target.value)} placeholder="Alex" required />
          </label>
          <label className="field">
            <span className="field-label">Age they&apos;re turning</span>
            <input type="number" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" />
          </label>
          <label className="field">
            <span className="field-label">Lock until (optional)</span>
            <input type="date" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} />
            <span className="hint">The link shows a countdown until midnight of this day.</span>
          </label>
        </div>
      </section>

      <section className="card">
        <h2>2. Inside jokes</h2>
        <p className="hint">Things only they would get. The game uses them to mess with them.</p>
        {jokes.map((j, i) => (
          <input
            key={i}
            className="joke-input"
            value={j}
            maxLength={120}
            placeholder={
              ["I still owe you $5 from 2019", "I cried at a dog food commercial", "I can't parallel park"][i]
            }
            onChange={(e) => setJokes((prev) => prev.map((x, k) => (k === i ? e.target.value : x)))}
          />
        ))}
      </section>

      <section className="card">
        <h2>3. Photos</h2>
        <p className="hint">Up to 3. Each one can be transformed with a prompt. They show up in the game and the finale.</p>
        <div className="photo-grid">
          {photos.map((p, i) => (
            <PhotoSlot
              key={i}
              index={i}
              value={p}
              hint={i === 0 && game.id === "secret-admirer" ? "A photo of you" : undefined}
              onChange={(v) => setPhotos((prev) => prev.map((x, k) => (k === i ? v : x)))}
            />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>4. Your voice</h2>
        <p className="hint">
          It plays normally when they open the gift, comes back twisted and creepy in the middle, then normal again
          at the end with the birthday song.
        </p>
        <VoiceRecorder
          clip="main"
          label="Main voice note"
          hint="Something you'd say to them. Up to 30 seconds."
          ideas={["Happy birthday! I broke your phone, so buy a new one for the new age.", "Hey, it's me. Happy birthday, you old legend!"]}
          value={mainVoice}
          onChange={setMainVoice}
          engine={engine.current}
        />
        <VoiceRecorder
          clip="creepy"
          label="Creepy line (optional)"
          hint="Used for the scary moments. If you skip it, your main note gets the creepy treatment."
          ideas={["Don't close this window.", "You thought this was a real gift?", "I'm right behind you."]}
          value={creepyVoice}
          onChange={setCreepyVoice}
          engine={engine.current}
        />
      </section>

      <section className="card">
        <h2>5. The birthday message *</h2>
        <p className="hint">Shown at the very end, after all the chaos. Make it sweet.</p>
        <textarea
          rows={5}
          maxLength={800}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Sorry for the scare 😅 Happy birthday! I'm so lucky to have you…"
          required
        />
        <div className="counter">{message.length}/800</div>
      </section>

      {error && <p className="warn center">{error}</p>}
      <button className="btn btn-primary btn-lg wide" disabled={busy}>
        {busy ? status || "Working…" : "Create my link 🎁"}
      </button>
      <p className="note center">
        Only use photos and voices of people who&apos;d be okay with a friendly prank.
      </p>
    </form>
  );
}
