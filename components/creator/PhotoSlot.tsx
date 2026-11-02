"use client";
import { useState } from "react";
import { blobToDataUrl, resizeImage } from "@/lib/client/image";

export interface PhotoValue {
  original: Blob;
  originalUrl: string;
  generated?: string; // data URL
  useGenerated: boolean;
  prompt: string;
}

const PROMPT_IDEAS = [
  "a royal oil painting with a crown",
  "a 90s action movie poster",
  "a superhero with a birthday cape",
  "a Renaissance statue holding a cake",
];

export function PhotoSlot({
  index,
  value,
  onChange,
  hint,
}: {
  index: number;
  value: PhotoValue | null;
  onChange: (v: PhotoValue | null) => void;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function pick(file: File) {
    setError("");
    try {
      const small = await resizeImage(file);
      if (value) URL.revokeObjectURL(value.originalUrl);
      onChange({ original: small, originalUrl: URL.createObjectURL(small), useGenerated: false, prompt: value?.prompt ?? "" });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function generate() {
    if (!value || !value.prompt.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: await blobToDataUrl(value.original), prompt: value.prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        setNotice("Photo transforms aren't switched on yet. The original photo will be used.");
      } else if (!res.ok || !data.image) {
        setError(data.error ?? "Something went wrong. Try again.");
      } else {
        onChange({ ...value, generated: data.image, useGenerated: true });
      }
    } catch {
      setError("Network error. Try again.");
    }
    setBusy(false);
  }

  const shown = value ? (value.useGenerated && value.generated ? value.generated : value.originalUrl) : null;

  return (
    <div className="photo-slot">
      <div className="photo-frame">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={`Photo ${index + 1}`} />
        ) : (
          <label className="photo-empty">
            <span>＋</span>
            <span>Add photo {index + 1}</span>
            {hint && <span className="hint">{hint}</span>}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
          </label>
        )}
        {busy && <div className="photo-busy">Creating… ✨</div>}
      </div>

      {value && (
        <div className="photo-tools">
          <textarea
            rows={2}
            maxLength={300}
            placeholder="Optional: transform it with a prompt ✨"
            value={value.prompt}
            onChange={(e) => onChange({ ...value, prompt: e.target.value })}
          />
          <div className="ideas">
            {PROMPT_IDEAS.map((p) => (
              <button type="button" key={p} className="chip" onClick={() => onChange({ ...value, prompt: p })}>
                {p}
              </button>
            ))}
          </div>
          <div className="row">
            <button
              type="button"
              className="btn btn-primary small"
              disabled={busy || !value.prompt.trim()}
              onClick={generate}
            >
              {value.generated ? "Try again" : "Transform ✨"}
            </button>
            {value.generated && (
              <button
                type="button"
                className="btn btn-ghost small"
                onClick={() => onChange({ ...value, useGenerated: !value.useGenerated })}
              >
                {value.useGenerated ? "Use original" : "Use transformed"}
              </button>
            )}
            <label className="btn btn-ghost small file-btn">
              Change
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
            </label>
            <button
              type="button"
              className="btn btn-ghost small"
              onClick={() => {
                URL.revokeObjectURL(value.originalUrl);
                onChange(null);
              }}
            >
              Remove
            </button>
          </div>
          {notice && <p className="note">{notice}</p>}
          {error && <p className="warn">{error}</p>}
        </div>
      )}
    </div>
  );
}
