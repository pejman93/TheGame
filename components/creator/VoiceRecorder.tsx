"use client";
import { useEffect, useRef, useState } from "react";
import type { AudioEngine, ClipName, VoiceEffect } from "@/lib/client/audio-engine";
import { recordingToWav } from "@/lib/client/wav";

const MAX_SECONDS = 30;

const PREVIEWS: { effect: VoiceEffect; label: string }[] = [
  { effect: "normal", label: "▶ Normal" },
  { effect: "demon", label: "👹 Creepy" },
  { effect: "reverse", label: "⏪ Backwards" },
  { effect: "stutter", label: "📺 Glitch" },
];

interface Props {
  clip: ClipName;
  label: string;
  hint: string;
  ideas: string[];
  value: Blob | null;
  onChange: (b: Blob | null) => void;
  engine: AudioEngine;
}

export function VoiceRecorder({ clip, label, hint, ideas, value, onChange, engine }: Props) {
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Checked after mount so server and browser render the same HTML.
  const [supported, setSupported] = useState(true);
  useEffect(() => setSupported("MediaRecorder" in window && Boolean(navigator.mediaDevices)), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      engine.setClip(clip, value ? await value.arrayBuffer() : null);
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [value, clip, engine]);

  useEffect(() => () => cleanup(), []);

  function cleanup() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }

  async function finish(blob: Blob) {
    setState("processing");
    try {
      const wav = await recordingToWav(blob);
      onChange(wav);
    } catch {
      setError("Could not read that recording. Please try again.");
    }
    setState("idle");
  }

  async function start() {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const rec = new MediaRecorder(s);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        cleanup();
        finish(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      };
      recorder.current = rec;
      rec.start();
      setSeconds(0);
      setState("recording");
      const startedAt = Date.now();
      timer.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(sec);
        if (sec >= MAX_SECONDS) stop();
      }, 250);
    } catch {
      setError("Microphone blocked. Allow microphone access in your browser, or upload an audio file.");
      cleanup();
    }
  }

  function stop() {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
  }

  return (
    <div className="recorder">
      <div className="field-label">{label}</div>
      <p className="hint">{hint}</p>
      <div className="ideas">
        {ideas.map((i) => (
          <span key={i} className="idea">
            “{i}”
          </span>
        ))}
      </div>

      <div className="recorder-controls">
        {state === "recording" ? (
          <button type="button" className="btn btn-danger" onClick={stop}>
            ■ Stop ({MAX_SECONDS - seconds}s left)
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!supported || state === "processing"}
            onClick={start}
          >
            {state === "processing" ? "Processing…" : value ? "● Record again" : "● Record"}
          </button>
        )}
        <label className="btn btn-ghost file-btn">
          Upload audio
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) finish(f);
            }}
          />
        </label>
        {value && state === "idle" && (
          <button type="button" className="btn btn-ghost" onClick={() => onChange(null)}>
            Delete
          </button>
        )}
      </div>
      {state === "recording" && <div className="rec-dot">Recording…</div>}

      {value && state === "idle" && (
        <div className="previews">
          <span className="muted">Hear how it will sound:</span>
          {PREVIEWS.map((p) => (
            <button
              type="button"
              key={p.effect}
              className="chip"
              onClick={() => {
                engine.unlock();
                engine.stopAll();
                engine.play(clip, p.effect);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {!supported && <p className="warn">This browser can&apos;t record. You can upload an audio file instead.</p>}
      {error && <p className="warn">{error}</p>}
    </div>
  );
}
