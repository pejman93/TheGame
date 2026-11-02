import type { GameScript } from "./types";

export const theHaunting: GameScript = {
  theme: "haunt",
  build(cfg) {
    const n = cfg.recipientName;
    const s = cfg.senderName;
    const candles = Math.max(3, Math.min(cfg.age ?? 7, 12));

    return [
      {
        type: "gate",
        icon: "🕯️",
        kicker: "NEW MESSAGE",
        title: "You have 1 unread message",
        text: "Sender: unknown\nReceived: 3:33 AM",
        button: "Read message",
        note: "🔊 Turn your sound on. Trust us.",
      },
      {
        type: "voice",
        clip: "main",
        effect: "normal",
        maxDuration: 2.2,
        title: "Voice message",
        text: "Playing…",
        after: { sfx: "static", text: "…signal lost" },
      },
      {
        type: "chat",
        variant: "ghost",
        steps: [
          { drone: true },
          { pause: 1200 },
          { say: "…hello?" },
          { say: "is someone there?" },
          { say: `${n}… is that you?` },
          { choices: ["Yes", "Who is this?"], replies: ["i knew it.", "you know who i am."] },
          { say: "i have been waiting for you" },
          { say: "for a very long time" },
          { sfx: "heartbeat" },
          { say: "since the day you were born", delay: 1200 },
          { say: "say something. i can hear you." },
          { input: "Type something…", reply: "shhh." },
          { voice: "creepy", effect: "reverse" },
          { say: "did you hear that?", delay: 1200 },
        ],
      },
      {
        type: "glitch",
        variant: "haunt",
        lines: ["I SEE YOU", n.toUpperCase(), "I SEE YOU", "DON'T LOOK AWAY"],
        audio: [{ clip: "creepy", effect: "demon" }],
      },
      {
        type: "chat",
        variant: "ghost",
        steps: [
          { say: "i need you to do something for me" },
          { say: "it is very important" },
          { say: "there is a ritual" },
          { say: "it happens once a year" },
          { choices: ["…what ritual?", "I'm not doing anything"], replies: ["you will see.", "oh, you will."] },
        ],
      },
      { type: "candles", count: candles },
      { type: "blackout", text: `${n.toLowerCase()}.` },
      {
        type: "finale-gate",
        icon: "👻",
        title: "the spirit has one last message for you",
        text: "press to receive it… if you dare",
        button: "Receive it",
      },
      {
        type: "finale",
        headline: `Happy Birthday, ${n}!`,
        subline: `The only spirit here is the party spirit. 👻🎂 Love, ${s}`,
      },
    ];
  },
};
