"use client";
import { useEffect, useRef, useState } from "react";
import { vibrate } from "@/lib/client/audio-engine";
import { sleep, type StageProps } from "../shared";

type Msg = { from: "them" | "me" | "system"; text: string };
type Pending = { kind: "choices"; options: string[] } | { kind: "input"; placeholder: string } | null;

export function Chat({ stage, audio, next }: StageProps<"chat">) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [inputValue, setInputValue] = useState("");
  const resolver = useRef<((v: string | number) => void) | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const ghost = stage.variant === "ghost";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing, pending]);

  useEffect(() => {
    let cancelled = false;
    const push = (m: Msg) => setMsgs((prev) => [...prev, m]);
    const ask = (p: NonNullable<Pending>) =>
      new Promise<string | number>((resolve) => {
        resolver.current = resolve;
        setPending(p);
      });
    const say = async (text: string) => {
      setTyping(true);
      await sleep(Math.min(2200, Math.max(650, 350 + text.length * 38)));
      if (cancelled) return false;
      setTyping(false);
      push({ from: "them", text });
      return true;
    };

    (async () => {
      await sleep(500);
      for (const step of stage.steps) {
        if (cancelled) return;
        if ("say" in step) {
          if (!(await say(step.say))) return;
          audio.sfx(step.sfx ?? (ghost ? "click" : "pop"));
          if (step.vibrate) vibrate([90, 50, 90]);
          await sleep(step.delay ?? 450);
        } else if ("choices" in step) {
          const i = (await ask({ kind: "choices", options: step.choices })) as number;
          if (cancelled) return;
          push({ from: "me", text: step.choices[i] });
          await sleep(400);
          const reply = step.replies?.[i];
          if (reply) {
            if (!(await say(reply))) return;
            audio.sfx(ghost ? "click" : "pop");
            await sleep(450);
          }
        } else if ("input" in step) {
          const text = String(await ask({ kind: "input", placeholder: step.input }));
          if (cancelled) return;
          push({ from: "me", text });
          await sleep(500);
          if (step.reply) {
            if (!(await say(step.reply))) return;
            audio.sfx(ghost ? "click" : "pop");
            await sleep(450);
          }
        } else if ("voice" in step) {
          if (!audio.hasClip(step.voice) && !audio.hasClip("main")) continue;
          push({ from: "system", text: step.caption ?? "🔊 …" });
          await audio.play(step.voice, step.effect, { maxDuration: step.maxDuration });
          await sleep(300);
        } else if ("pause" in step) {
          await sleep(step.pause);
        } else if ("sfx" in step) {
          audio.sfx(step.sfx);
        } else if ("drone" in step) {
          if (step.drone) audio.startDrone();
          else audio.stopDrone();
        }
      }
      await sleep(1300);
      if (!cancelled) next();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answer = (v: string | number) => {
    const r = resolver.current;
    resolver.current = null;
    setPending(null);
    setInputValue("");
    audio.sfx("click");
    r?.(v);
  };

  const visible = ghost ? msgs.slice(-4) : msgs;

  return (
    <div className={`stage chat ${ghost ? "chat-ghost" : "chat-app"}`}>
      {!ghost && (
        <header className="chat-head">
          <div className="avatar" aria-hidden>
            {stage.avatar}
          </div>
          <div>
            <div className="chat-name">{stage.name}</div>
            <div className="chat-status">{stage.status}</div>
          </div>
        </header>
      )}
      <div className="chat-body" aria-live="polite">
        {visible.map((m, i) => (
          <div key={msgs.length - visible.length + i} className={`msg msg-${m.from}`}>
            {m.text}
          </div>
        ))}
        {typing && (
          <div className="msg msg-them typing" aria-label="typing">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="chat-actions">
        {pending?.kind === "choices" &&
          pending.options.map((o, i) => (
            <button key={o} className="btn btn-choice" onClick={() => answer(i)}>
              {o}
            </button>
          ))}
        {pending?.kind === "input" && (
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              if (inputValue.trim()) answer(inputValue.trim().slice(0, 80));
            }}
          >
            <input
              autoFocus
              value={inputValue}
              maxLength={80}
              placeholder={pending.placeholder}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
