"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eyes } from "@/components/brand/Eyes";
import { Logo } from "@/components/brand/Logo";
import { AudioEngine } from "@/lib/client/audio-engine";
import { dataUrlToBlob, resizeImage } from "@/lib/client/image";
import { GAMES, getGame } from "@/lib/games";
import type { GameId, SurpriseInput } from "@/lib/types";
import { MicRecorder } from "./MicRecorder";
import { PhotoPicker, type PhotoValue } from "./PhotoPicker";

type StepId = "game" | "names" | "photos" | "voice" | "jokes" | "message" | "delivery";
const STEPS: StepId[] = ["game", "names", "photos", "voice", "jokes", "message", "delivery"];
const OPTIONAL: StepId[] = ["photos", "voice", "jokes"];
const JOKE_IDEAS = ["You still owe me $5 from 2019", "You cried at a dog food commercial", "You can't parallel park"];

async function upload(blob: Blob): Promise<string> {
  const res = await fetch("/api/upload", { method: "POST", headers: { "content-type": blob.type }, body: blob });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed. Please try again.");
  return data.url as string;
}

export function Wizard({ initialGame, transformEnabled }: { initialGame?: GameId; transformEnabled: boolean }) {
  const engine = useRef<AudioEngine | null>(null);
  if (!engine.current) engine.current = new AudioEngine();

  const [step, setStep] = useState(initialGame ? 1 : 0);
  const [game, setGame] = useState<GameId | undefined>(initialGame);
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [age, setAge] = useState("");
  const [photos, setPhotos] = useState<(PhotoValue | null)[]>([null, null, null]);
  const [mainVoice, setMainVoice] = useState<Blob | null>(null);
  const [creepyVoice, setCreepyVoice] = useState<Blob | null>(null);
  const [showCreepy, setShowCreepy] = useState(false);
  const [jokes, setJokes] = useState<string[]>([]);
  const [jokeDraft, setJokeDraft] = useState("");
  const [message, setMessage] = useState("");
  const [when, setWhen] = useState<"now" | "date">("now");
  const [date, setDate] = useState("");

  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [resultId, setResultId] = useState<string | null>(null);

  const id = STEPS[step];
  const info = game ? getGame(game) : undefined;
  const name = recipient.trim() || "them";
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setError("");
  }, [step]);

  const ageOk = !age || (Number.isInteger(Number(age)) && Number(age) >= 1 && Number(age) <= 120);
  const valid: Record<StepId, boolean> = {
    game: Boolean(game),
    names: Boolean(recipient.trim() && sender.trim() && ageOk),
    photos: true,
    voice: true,
    jokes: true,
    message: Boolean(message.trim()),
    delivery: when === "now" || Boolean(date),
  };

  const addJoke = (text: string) => {
    const t = text.trim();
    if (!t || jokes.length >= 3) return;
    setJokes((j) => [...j, t.slice(0, 120)]);
    setJokeDraft("");
  };

  const next = () => {
    if (!valid[id]) return;
    if (id === "jokes" && jokeDraft.trim()) addJoke(jokeDraft);
    if (step < STEPS.length - 1) setStep(step + 1);
    else create();
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  async function create() {
    if (!game) return;
    setCreating(true);
    setError("");
    try {
      const chosen = photos.filter((p): p is PhotoValue => Boolean(p));
      const photoUrls: { url: string }[] = [];
      for (let i = 0; i < chosen.length; i++) {
        setStatus(`Uploading photo ${i + 1} of ${chosen.length}…`);
        const p = chosen[i];
        const blob = p.useGenerated && p.generated ? await resizeImage(await dataUrlToBlob(p.generated)) : p.original;
        photoUrls.push({ url: await upload(blob) });
      }
      const voice: SurpriseInput["voice"] = {};
      if (mainVoice) {
        setStatus("Uploading your voice…");
        voice.main = await upload(mainVoice);
      }
      if (creepyVoice) voice.creepy = await upload(creepyVoice);
      setStatus("Wrapping the gift…");
      const body: SurpriseInput = {
        game,
        recipientName: recipient,
        senderName: sender,
        age: age ? Number(age) : undefined,
        message,
        jokes,
        photos: photoUrls,
        voice,
        unlockAt: when === "date" && date ? new Date(`${date}T00:00:00`).toISOString() : undefined,
      };
      const res = await fetch("/api/surprise", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.id) throw new Error(data.error ?? "Couldn't save your surprise. Please try again.");
      setResultId(data.id);
    } catch (e) {
      setError((e as Error).message);
    }
    setCreating(false);
    setStatus("");
  }

  if (resultId && info) {
    return <Done id={resultId} recipient={recipient} shareTitle={info.shareTitle} onAgain={() => location.assign("/create")} />;
  }

  const question: Record<StepId, { title: string; sub: string }> = {
    game: { title: "Which prank?", sub: "Each one gets strange in its own way, and all of them end in the same happy surprise." },
    names: { title: "Who's the birthday?", sub: "Just first names are perfect." },
    photos: {
      title: game === "secret-admirer" ? "Add a photo of you" : `Add a photo of ${name}`,
      sub:
        game === "secret-admirer"
          ? "It's shown blurred as the mystery admirer, then revealed at the end. Add more of the two of you if you like."
          : "It shows up in the game, in the breaking news and in the finale. Up to three.",
    },
    voice: {
      title: "Now, your voice",
      sub: "Say something to them. It plays normally at the start, comes back creepy in the middle and sweet again at the end.",
    },
    jokes: {
      title: `Something only ${name} would get`,
      sub: "Up to three inside jokes. They turn into legal clauses, news headlines and whispers.",
    },
    message: { title: `Your message to ${name}`, sub: "The last thing they read, after all the chaos. Make it count." },
    delivery: { title: "When should it open?", sub: "You can send the link today either way." },
  };

  const last = step === STEPS.length - 1;

  return (
    <div className="wizard">
      <header className="wiz-top">
        {step > 0 ? (
          <button type="button" className="icon-btn" onClick={back} aria-label="Back">
            ←
          </button>
        ) : (
          <Logo />
        )}
        <div className="wiz-progress" aria-hidden>
          <div style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <span className="wiz-count">
          {step + 1}/{STEPS.length}
        </span>
      </header>

      <form
        className="wiz-body"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <div key={id} className="wiz-step">
          {info && id !== "game" && (
            <div className="wiz-game">
              {info.emoji} {info.title}
            </div>
          )}
          <h1 className="wiz-q">{question[id].title}</h1>
          <p className="wiz-sub">{question[id].sub}</p>

          {id === "game" && (
            <div className="choice-list" role="radiogroup">
              {GAMES.filter((g) => g.available).map((g) => (
                <button
                  type="button"
                  key={g.id}
                  role="radio"
                  aria-checked={game === g.id}
                  className={`choice ${game === g.id ? "on" : ""}`}
                  onClick={() => setGame(g.id)}
                >
                  <span className="choice-emoji" aria-hidden>
                    {g.emoji}
                  </span>
                  <span className="choice-text">
                    <strong>{g.title}</strong>
                    <span>{g.pitch}</span>
                  </span>
                  <span className="choice-check" aria-hidden>
                    ✓
                  </span>
                </button>
              ))}
            </div>
          )}

          {id === "names" && (
            <div className="fields">
              <label className="field">
                <span>Their name</span>
                <input
                  className="field-input big"
                  autoFocus
                  value={recipient}
                  maxLength={40}
                  placeholder="Sara"
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </label>
              <div className="field-row">
                <label className="field">
                  <span>Age (optional)</span>
                  <input
                    className="field-input"
                    inputMode="numeric"
                    value={age}
                    maxLength={3}
                    placeholder="30"
                    onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
                  />
                </label>
                <label className="field">
                  <span>From</span>
                  <input
                    className="field-input"
                    value={sender}
                    maxLength={40}
                    placeholder="Your name"
                    onChange={(e) => setSender(e.target.value)}
                  />
                </label>
              </div>
              {!ageOk && <p className="form-error">Age should be a number between 1 and 120.</p>}
            </div>
          )}

          {id === "photos" && (
            <PhotoPicker
              photos={photos}
              transformEnabled={transformEnabled}
              firstLabel={game === "secret-admirer" ? "Photo of you" : undefined}
              onChange={(i, v) => setPhotos((prev) => prev.map((x, k) => (k === i ? v : x)))}
            />
          )}

          {id === "voice" && (
            <div className="voice">
              <MicRecorder
                clip="main"
                value={mainVoice}
                onChange={setMainVoice}
                engine={engine.current}
                suggestion={`Happy birthday ${recipient.trim() || "you"}! I broke your phone, so buy a new one for the new age.`}
              />
              {showCreepy || creepyVoice ? (
                <div className="voice-extra">
                  <p className="field-label">A creepy line, just for the scary parts</p>
                  <MicRecorder
                    clip="creepy"
                    compact
                    value={creepyVoice}
                    onChange={setCreepyVoice}
                    engine={engine.current}
                    suggestion="Don't close this window…"
                  />
                </div>
              ) : (
                mainVoice && (
                  <button type="button" className="text-btn" onClick={() => setShowCreepy(true)}>
                    + Add a creepy line too (optional)
                  </button>
                )
              )}
            </div>
          )}

          {id === "jokes" && (
            <div className="jokes">
              {jokes.length < 3 && (
                <div className="joke-add">
                  <input
                    className="field-input"
                    autoFocus
                    value={jokeDraft}
                    maxLength={120}
                    placeholder="e.g. You still owe me $5 from 2019"
                    onChange={(e) => setJokeDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addJoke(jokeDraft);
                      }
                    }}
                  />
                  <button type="button" className="btn btn-quiet" disabled={!jokeDraft.trim()} onClick={() => addJoke(jokeDraft)}>
                    Add
                  </button>
                </div>
              )}
              {jokes.length > 0 && (
                <ul className="joke-list">
                  {jokes.map((j, i) => (
                    <li key={i}>
                      <span>“{j}”</span>
                      <button type="button" aria-label="Remove" onClick={() => setJokes((all) => all.filter((_, k) => k !== i))}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {jokes.length === 0 && (
                <div className="pill-row">
                  {JOKE_IDEAS.map((j) => (
                    <button type="button" key={j} className="pill" onClick={() => setJokeDraft(j)}>
                      {j}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {id === "message" && (
            <div className="field">
              <textarea
                className="field-input letter-input"
                autoFocus
                rows={6}
                maxLength={800}
                value={message}
                placeholder={`Sorry for the scare 😅 Happy birthday, ${recipient.trim() || "you"}…`}
                onChange={(e) => setMessage(e.target.value)}
              />
              <span className="counter">{message.length}/800</span>
            </div>
          )}

          {id === "delivery" && (
            <div className="choice-list" role="radiogroup">
              <button
                type="button"
                role="radio"
                aria-checked={when === "now"}
                className={`choice ${when === "now" ? "on" : ""}`}
                onClick={() => setWhen("now")}
              >
                <span className="choice-emoji" aria-hidden>
                  ⚡
                </span>
                <span className="choice-text">
                  <strong>Right away</strong>
                  <span>The link works as soon as you send it.</span>
                </span>
                <span className="choice-check" aria-hidden>
                  ✓
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={when === "date"}
                className={`choice ${when === "date" ? "on" : ""}`}
                onClick={() => setWhen("date")}
              >
                <span className="choice-emoji" aria-hidden>
                  🔒
                </span>
                <span className="choice-text">
                  <strong>On their birthday</strong>
                  <span>Sealed with a countdown until midnight. Perfect to send early.</span>
                </span>
                <span className="choice-check" aria-hidden>
                  ✓
                </span>
              </button>
              {when === "date" && (
                <label className="field">
                  <span>Their birthday</span>
                  <input className="field-input" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
                </label>
              )}
            </div>
          )}
        </div>

        <div className="wiz-actions">
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary btn-lg wide" type="submit" disabled={!valid[id] || creating}>
            {creating ? status || "Working…" : last ? "Create the surprise" : "Continue"}
          </button>
          {OPTIONAL.includes(id) && (
            <button type="button" className="text-btn center" onClick={() => setStep(step + 1)}>
              Skip
            </button>
          )}
        </div>
      </form>

      {creating && (
        <div className="creating" role="status">
          <Eyes size={160} follow={false} />
          <p>{status || "Wrapping the gift…"}</p>
        </div>
      )}
    </div>
  );
}

function Done({
  id,
  recipient,
  shareTitle,
  onAgain,
}: {
  id: string;
  recipient: string;
  shareTitle: string;
  onAgain: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [link, setLink] = useState("");
  useEffect(() => {
    setLink(`${window.location.origin}/play/${id}`);
    setCanShare("share" in navigator);
  }, [id]);
  const text = `${shareTitle} 👉 ${link}`;

  return (
    <div className="done">
      <Eyes size={180} />
      <h1 className="display small">The trap is set.</h1>
      <p className="lead">
        Send this link to <strong>{recipient}</strong>. Don&apos;t tell them what it is.
      </p>
      <div className="link-card">
        <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Your link" />
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
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
      <div className="share-row">
        {canShare && (
          <button className="btn btn-quiet" onClick={() => navigator.share({ text: shareTitle, url: link }).catch(() => {})}>
            Share…
          </button>
        )}
        <a className="btn btn-quiet" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <a className="btn btn-quiet" href={`/play/${id}?preview=1`} target="_blank" rel="noreferrer">
          Preview
        </a>
      </div>
      <p className="fine-print">The preview skips the birthday lock. The link above keeps it.</p>
      <div className="done-foot">
        <button className="text-btn" onClick={onAgain}>
          Make another one
        </button>
        <Link href="/" className="text-btn">
          Home
        </Link>
      </div>
    </div>
  );
}
