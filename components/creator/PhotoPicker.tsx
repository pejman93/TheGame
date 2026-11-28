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

const IDEAS = ["a royal oil painting", "a 90s action movie poster", "a noir detective", "a Renaissance statue"];

/** Three square photo tiles. Optional "Restyle" when photo transforms are switched on. */
export function PhotoPicker({
  photos,
  onChange,
  transformEnabled,
  firstLabel,
}: {
  photos: (PhotoValue | null)[];
  onChange: (index: number, v: PhotoValue | null) => void;
  transformEnabled: boolean;
  firstLabel?: string;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(i: number, file: File) {
    setError("");
    try {
      const small = await resizeImage(file);
      const prev = photos[i];
      if (prev) URL.revokeObjectURL(prev.originalUrl);
      onChange(i, { original: small, originalUrl: URL.createObjectURL(small), useGenerated: false, prompt: "" });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function restyle(i: number) {
    const p = photos[i];
    if (!p || !p.prompt.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: await blobToDataUrl(p.original), prompt: p.prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.image) setError(data.error ?? data.message ?? "That didn't work. Try again.");
      else onChange(i, { ...p, generated: data.image, useGenerated: true });
    } catch {
      setError("Network error. Try again.");
    }
    setBusy(false);
  }

  const current = editing !== null ? photos[editing] : null;

  return (
    <div className="photos">
      <div className="photo-tiles">
        {photos.map((p, i) => {
          const src = p ? (p.useGenerated && p.generated ? p.generated : p.originalUrl) : null;
          return (
            <div key={i} className="photo-cell">
              <div className={`photo-tile ${src ? "has" : ""}`}>
                {src ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${i + 1}`} />
                    <button
                      type="button"
                      className="tile-x"
                      aria-label="Remove photo"
                      onClick={() => {
                        if (p) URL.revokeObjectURL(p.originalUrl);
                        if (editing === i) setEditing(null);
                        onChange(i, null);
                      }}
                    >
                      ×
                    </button>
                    {busy && editing === i && <div className="tile-busy">Restyling…</div>}
                  </>
                ) : (
                  <label className="tile-add">
                    <span className="plus">+</span>
                    <span>{i === 0 && firstLabel ? firstLabel : "Add photo"}</span>
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && pick(i, e.target.files[0])} />
                  </label>
                )}
              </div>
              {p && transformEnabled && (
                <button type="button" className="text-btn" onClick={() => setEditing(editing === i ? null : i)}>
                  ✨ Restyle
                </button>
              )}
            </div>
          );
        })}
      </div>

      {current && editing !== null && (
        <div className="restyle">
          <input
            className="field-input"
            placeholder="Turn it into… (e.g. a royal oil painting)"
            maxLength={300}
            value={current.prompt}
            onChange={(e) => onChange(editing, { ...current, prompt: e.target.value })}
          />
          <div className="pill-row">
            {IDEAS.map((idea) => (
              <button type="button" key={idea} className="pill" onClick={() => onChange(editing, { ...current, prompt: idea })}>
                {idea}
              </button>
            ))}
          </div>
          <div className="pill-row">
            <button
              type="button"
              className="btn btn-primary small"
              disabled={busy || !current.prompt.trim()}
              onClick={() => restyle(editing)}
            >
              {busy ? "Restyling…" : current.generated ? "Try again" : "Restyle"}
            </button>
            {current.generated && (
              <button
                type="button"
                className="btn btn-quiet small"
                onClick={() => onChange(editing, { ...current, useGenerated: !current.useGenerated })}
              >
                {current.useGenerated ? "Use original" : "Use restyled"}
              </button>
            )}
          </div>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
