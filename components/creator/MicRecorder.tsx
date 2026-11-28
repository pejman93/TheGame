"use client";
import { useEffect, useRef, useState } from "react";
import type { AudioEngine, ClipName, VoiceEffect } from "@/lib/client/audio-engine";
import { recordingToWav } from "@/lib/client/wav";

const MAX_SECONDS = 30;

function seconds(wav: Blob) {
  return Math.max(1, Math.round((wav.size - 44) / 2 / 22050));
}

/** One big mic button: record, listen back, hear the creepy version. */
export function MicRecorder({
  clip,
  value,
  onChange,
  engine,
  suggestion,
  compact = false,
}: {
  clip: ClipName;
  value: Blob | null;
  onChange: (b: Blob | null) => void;
  engine: AudioEngine;
  suggestion?: string;
  compact?: boolean;
}) {
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => setSupported("MediaRecorder" in window && Boolean(navigator.mediaDevices)), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const data = value ? await value.arrayBuffer() : null;
      if (alive) engine.setClip(clip, data);
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
      onChange(await recordingToWav(blob));
    } catch {
      setError("Couldn't read that recording. Please try again.");
    }
    setState("idle");
  }

  async function start() {
    setError("");
    engine.unlock();
    engine.stopAll();
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
      setElapsed(0);
      setState("recording");
      const t0 = Date.now();
      timer.current = setInterval(() => {
        const sec = Math.floor((Date.now() - t0) / 1000);
        setElapsed(sec);
        if (sec >= MAX_SECONDS) stop();
      }, 200);
    } catch {
      setError("Your browser blocked the microphone. Allow it, or upload a voice file instead.");
      cleanup();
    }
  }

  function stop() {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
  }

  const play = (effect: VoiceEffect) => {
    engine.unlock();
    engine.stopAll();
    engine.play(clip, effect);
  };

  const recording = state === "recording";
  const status = recording
    ? `0:${String(elapsed).padStart(2, "0")} · tap to stop`
    : state === "processing"
      ? "Saving…"
      : value
        ? `Recorded · ${seconds(value)}s`
        : "Tap to record";

  return (
    <div className={`mic ${compact ? "mic-compact" : ""}`}>
      <button
        type="button"
        className={`mic-btn ${recording ? "rec" : ""} ${value && !recording ? "has-clip" : ""}`}
        onClick={recording ? stop : start}
        disabled={!supported || state === "processing"}
        aria-label={recording ? "Stop recording" : "Start recording"}
      >
        {recording ? (
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
            <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
          </svg>
        )}
      </button>
      <div className="mic-status" aria-live="polite">
        {status}
      </div>

      {!value && !recording && suggestion && <p className="mic-suggest">Try: “{suggestion}”</p>}

      {value && !recording && (
        <div className="mic-actions">
          <button type="button" className="pill" onClick={() => play("normal")}>
            ▶ Play
          </button>
          <button type="button" className="pill pill-accent" onClick={() => play("demon")}>
            👹 Hear it creepy
          </button>
          <button type="button" className="pill" onClick={() => play("reverse")}>
            ⏪ Backwards
          </button>
          <button type="button" className="text-btn" onClick={() => onChange(null)}>
            Delete
          </button>
        </div>
      )}

      {!recording && (
        <label className="text-btn file-link">
          {supported ? "or upload a voice file" : "Recording isn't supported here. Upload a voice file"}
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
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
