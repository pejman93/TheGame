import type { AudioEngine } from "@/lib/client/audio-engine";
import type { SurpriseConfig } from "@/lib/types";
import type { Stage, StageType } from "@/games/types";

export interface StageProps<T extends StageType> {
  stage: Extract<Stage, { type: T }>;
  cfg: SurpriseConfig;
  audio: AudioEngine;
  next: () => void;
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
