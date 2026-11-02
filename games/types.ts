import type { ClipName, SfxName, VoiceEffect } from "@/lib/client/audio-engine";
import type { SurpriseConfig } from "@/lib/types";

export type ChatStep =
  | { say: string; delay?: number; sfx?: SfxName; vibrate?: boolean }
  | { choices: string[]; replies?: string[] }
  | { input: string; reply?: string }
  | { voice: ClipName; effect: VoiceEffect; maxDuration?: number; caption?: string }
  | { pause: number }
  | { sfx: SfxName }
  | { drone: boolean };

export interface VoiceCue {
  clip: ClipName;
  effect: VoiceEffect;
}

export type Stage =
  | { type: "gate"; icon: string; kicker?: string; title: string; text: string; button: string; note?: string }
  | {
      type: "voice";
      clip: ClipName;
      effect: VoiceEffect;
      title: string;
      text?: string;
      maxDuration?: number;
      after?: { sfx?: SfxName; text?: string };
    }
  | { type: "chat"; variant: "chat" | "ghost"; name?: string; avatar?: string; status?: string; steps: ChatStep[] }
  | { type: "terms"; title: string; intro: string; items: string[]; accept: string; decline: string }
  | { type: "loading"; title: string; messages: string[] }
  | { type: "captcha"; prompt: string }
  | { type: "glitch"; variant: "system" | "haunt" | "signal"; lines: string[]; audio: VoiceCue[] }
  | { type: "blackout"; text?: string }
  | { type: "candles"; count: number }
  | { type: "reveal"; title: string; clues: string[]; cutText: string }
  | { type: "finale-gate"; icon: string; title: string; text: string; button: string }
  | { type: "finale"; headline: string; subline: string };

export type StageType = Stage["type"];

export interface GameScript {
  /** CSS theme applied while playing (the finale has its own look). */
  theme: "office" | "haunt" | "admirer";
  build(cfg: SurpriseConfig): Stage[];
}
