import type { ChatStep, GameScript } from "./types";

export const secretAdmirer: GameScript = {
  theme: "admirer",
  build(cfg) {
    const n = cfg.recipientName;
    const s = cfg.senderName;
    const knows: ChatStep[] = cfg.jokes.length
      ? cfg.jokes.slice(0, 2).map((j) => ({ say: `like… ${j}` }))
      : [{ say: "like how you laugh at your own jokes before you finish them" }];

    return [
      {
        type: "gate",
        icon: "💌",
        kicker: "ANONYMOUS",
        title: "Someone has a crush on you",
        text: `${n}, an anonymous person sent you a secret message. Do you want to read it?`,
        button: "Open it 👀",
        note: "🔊 Sound on",
      },
      {
        type: "voice",
        clip: "main",
        effect: "disguise",
        title: "Voice note 🤫",
        text: "The sender disguised their voice to stay anonymous.",
      },
      {
        type: "chat",
        variant: "chat",
        name: "Anonymous",
        avatar: "🤫",
        status: "online",
        steps: [
          { say: `hi ${n} 🙈` },
          { say: "you don't know me… or maybe you do" },
          { say: "i've been thinking about you a lot lately" },
          { choices: ["Who is this??", "Stop it 😳"], replies: ["can't tell you yet 🤫", "make me 😏"] },
          { say: "but i know things about you" },
          ...knows,
          { say: "see? i know. 😌" },
          { say: "want a clue?" },
          { choices: ["Yes!", "Obviously"] },
        ],
      },
      {
        type: "reveal",
        title: "Who is it?",
        clues: [
          "Clue #1: I know exactly how old you're about to be.",
          "Clue #2: We've known each other for a while.",
          "Clue #3: Today I'm thinking about you more than any other day.",
        ],
        cutText: "Connection lost",
      },
      {
        type: "chat",
        variant: "chat",
        name: "Anonymous",
        avatar: "🤫",
        status: "reconnecting…",
        steps: [
          { say: "sorry. connection dropped." },
          { say: "wait" },
          { say: "someone else is in this chat", sfx: "error" },
          { say: `${n}, don't trust the next message` },
          { voice: "creepy", effect: "deep", caption: "🔊 voice note from: ████" },
          { say: "i've been watching you" },
          { say: "every year" },
          { say: "on this exact day", vibrate: true, delay: 1000 },
        ],
      },
      {
        type: "glitch",
        variant: "signal",
        lines: ["SIGNAL INTERCEPTED", "ADMIRER IDENTITY: ████████", "DECRYPTING…", "DECRYPTING…"],
        audio: [
          { clip: "main", effect: "stutter" },
          { clip: "creepy", effect: "radio" },
        ],
      },
      { type: "blackout" },
      {
        type: "finale-gate",
        icon: "💖",
        title: "Your admirer is ready to reveal themselves",
        text: "Are you ready?",
        button: "Reveal",
      },
      {
        type: "finale",
        headline: `Happy Birthday, ${n}!`,
        subline: `Your secret admirer was ${s} all along. 💖`,
      },
    ];
  },
};
