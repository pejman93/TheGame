import type { GameId } from "./types";

export interface GameInfo {
  id: GameId;
  title: string;
  emoji: string;
  trick: string;
  reveal: string;
  bestFor: string;
  available: boolean;
  /** Shown on the create page for this game. */
  tip?: string;
  /** Title of the link preview the receiver sees (must not spoil the surprise). */
  shareTitle: string;
  shareDescription: string;
}

export const GAMES: GameInfo[] = [
  {
    id: "gift-department",
    title: "The Gift Department",
    emoji: "📦",
    trick:
      "\"You've been selected for a gift.\" Endless absurd terms, forms and a very polite agent who slowly loses it.",
    reveal: "The paperwork was a birthday card all along.",
    bestFor: "Anyone",
    available: true,
    tip: "Inside jokes show up as clauses in the Terms & Conditions. The sillier the better.",
    shareTitle: "📦 A gift has been reserved in your name",
    shareDescription: "Gift Department — please claim your package.",
  },
  {
    id: "the-haunting",
    title: "The Haunting",
    emoji: "🕯️",
    trick:
      "A ghost slowly takes over the screen, and your voice comes back… wrong.",
    reveal: "The ghost just wanted to sing happy birthday.",
    bestFor: "Brave friends",
    available: true,
    tip: "Record a creepy line too (\"Don't close this window…\"). It gets the full ghost treatment.",
    shareTitle: "You have 1 unread message",
    shareDescription: "Sender: unknown",
  },
  {
    id: "secret-admirer",
    title: "Secret Admirer",
    emoji: "💌",
    trick:
      "Mysterious anonymous messages. \"I've been thinking about you…\" Then things get a little too intense.",
    reveal: "It was you. With a sweet message.",
    bestFor: "Partners & beloved",
    available: true,
    tip: "Put a photo of YOU first: it is shown blurred as the admirer's photo and revealed at the end.",
    shareTitle: "💌 Someone has a crush on you",
    shareDescription: "An anonymous message is waiting for you.",
  },
  {
    id: "system-breach",
    title: "System Breach",
    emoji: "💻",
    trick: "Their device seems taken over: a fake terminal and a mysterious hacker giving orders.",
    reveal: "The hacker's final demand: accept being one year older.",
    bestFor: "Friends who can take a joke",
    available: false,
    shareTitle: "Security notice",
    shareDescription: "Action required.",
  },
  {
    id: "you-won",
    title: "You Won!",
    emoji: "🎰",
    trick: "A shady prize, a rigged spin wheel and a never-ending claim process.",
    reveal: "The real prize is the message from you.",
    bestFor: "Anyone",
    available: false,
    shareTitle: "🎉 Congratulations, you won",
    shareDescription: "Claim your prize.",
  },
  {
    id: "case-file",
    title: "The Case File",
    emoji: "🕵️",
    trick: "\"You are a suspect.\" Clues, evidence photos and an interrogation full of inside jokes.",
    reveal: "The crime: getting older. Verdict: celebrate.",
    bestFor: "Friends & siblings",
    available: false,
    shareTitle: "Case #4471 — you are listed",
    shareDescription: "Please review the evidence.",
  },
  {
    id: "locked-in",
    title: "Locked In",
    emoji: "🔐",
    trick: "A digital escape room with puzzles only they can solve.",
    reveal: "The final door opens onto the party.",
    bestFor: "Puzzle lovers",
    available: false,
    shareTitle: "Can you get out?",
    shareDescription: "One room. One way out.",
  },
  {
    id: "performance-review",
    title: "Performance Review",
    emoji: "📊",
    trick: "A cold HR assessment of their past year of life, with a ridiculous scorecard.",
    reveal: "Promoted to the next age.",
    bestFor: "Coworkers & friends",
    available: false,
    shareTitle: "Your annual review is ready",
    shareDescription: "Please review before end of day.",
  },
  {
    id: "mission-control",
    title: "Mission Control",
    emoji: "🚀",
    trick: "A launch countdown that keeps failing with alarms and emergencies.",
    reveal: "Lift-off into a new year, with fireworks.",
    bestFor: "Kids & family",
    available: false,
    shareTitle: "Launch sequence pending",
    shareDescription: "Mission Control needs you.",
  },
  {
    id: "rigged-quiz",
    title: "The Rigged Quiz Show",
    emoji: "🎤",
    trick: "A sarcastic host roasts every answer and the scoreboard is fixed.",
    reveal: "The jackpot round is the birthday surprise.",
    bestFor: "Family & friends",
    available: false,
    shareTitle: "You're the next contestant",
    shareDescription: "Lights. Camera. Questions.",
  },
];

export function getGame(id: string): GameInfo | undefined {
  return GAMES.find((g) => g.id === id);
}
