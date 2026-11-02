import type { GameScript } from "./types";

export const giftDepartment: GameScript = {
  theme: "office",
  build(cfg) {
    const n = cfg.recipientName;
    const s = cfg.senderName;
    const ref = `GD-${cfg.id.slice(0, 6).toUpperCase()}`;
    const jokeClauses = cfg.jokes.map((j) => `I acknowledge that "${j}" is true and legally binding.`);

    return [
      {
        type: "gate",
        icon: "📦",
        kicker: `PACKAGE ${ref}`,
        title: `Hello ${n}.`,
        text: "A gift has been reserved in your name by an anonymous sender. Please complete the short claim process to receive it.",
        button: "Open my gift",
        note: "🔊 Sound on for the full experience",
      },
      {
        type: "voice",
        clip: "main",
        effect: "normal",
        maxDuration: 2.4,
        title: "Attached voice note",
        text: "The sender attached a voice note to your package.",
        after: {
          sfx: "error",
          text: "⚠ Playback interrupted. Voice notes are released only after the claim process.",
        },
      },
      {
        type: "chat",
        variant: "chat",
        name: "Gerald",
        avatar: "🧑‍💼",
        status: "Gift Department · online",
        steps: [
          { say: `Hi ${n}! I'm Gerald from the Gift Department. 👋` },
          { say: "Congratulations! Someone has sent you a gift." },
          { say: "Before I can release it, I need to complete a few quick formalities." },
          {
            choices: ["Sure, go ahead", "What gift?"],
            replies: ["Wonderful. This will only take a minute.", "A very good one. That is all I am allowed to say."],
          },
          { say: "First, please read and accept our Terms & Conditions." },
          { say: "All of them.", delay: 900 },
        ],
      },
      {
        type: "terms",
        title: "Gift Release Agreement (v13.2)",
        intro: `By claiming package ${ref}, ${n} ("the Recipient") agrees to the following:`,
        items: [
          `I agree to become ${cfg.age ? `${cfg.age} years old` : "one year older"}, effective immediately.`,
          `I confirm I am not a robot, a ghost, or ${s} in disguise.`,
          ...jokeClauses,
          "I waive my right to complain about the gift wrapping.",
          "I understand this gift cannot be returned, exchanged, or explained.",
          "I will not close this window. Under any circumstances.",
        ],
        accept: "I accept everything",
        decline: "Decline",
      },
      {
        type: "loading",
        title: "Processing your gift",
        messages: [
          "Verifying birthday credentials…",
          "Consulting the Gift Committee…",
          `Counting ${n}'s candles… this may take a while`,
          "Oops. Starting over…",
          "Wrapping… unwrapping… re-wrapping…",
        ],
      },
      { type: "captcha", prompt: `Security check: select all images of ${n} being dramatic` },
      {
        type: "chat",
        variant: "chat",
        name: "Gerald",
        avatar: "🧑‍💼",
        status: "Gift Department · online",
        steps: [
          { say: "Thank you. Verification complete. ✅" },
          { say: "Your gift is almost ready." },
          { pause: 1500 },
          { say: "…" },
          { say: `${n}, can I ask you something?` },
          {
            choices: ["Okay?", "Is something wrong?"],
            replies: ["Do you know who sent this package?", "Nothing is wrong. Do you know who sent this package?"],
          },
          { choices: [`Was it ${s}?`, "No idea"], replies: ["Interesting.", "Interesting."] },
          { say: "They told us you would say that." },
          { voice: "creepy", effect: "deep", caption: "🔊 voice note (unscheduled)" },
          { say: "That voice note was not supposed to play." },
          { say: "Please do not close this window.", sfx: "error" },
          { say: "Something is wrong with the system.", vibrate: true, delay: 900 },
        ],
      },
      {
        type: "glitch",
        variant: "system",
        lines: [
          "GIFT DEPARTMENT // CRITICAL ERROR",
          `UNAUTHORIZED BIRTHDAY DETECTED: ${n.toUpperCase()}`,
          `AGE OVERFLOW: ${cfg.age ?? "??"} ▲`,
          "PACKAGE CONTAINMENT FAILURE",
          "DO NOT PANIC",
          "D̷O̶ ̸N̴O̷T̴ ̵P̶A̷N̸I̴C̷",
        ],
        audio: [
          { clip: "main", effect: "stutter" },
          { clip: "creepy", effect: "demon" },
        ],
      },
      { type: "blackout" },
      {
        type: "finale-gate",
        icon: "🎁",
        title: "Package recovered.",
        text: "Final step: press the button below to claim your gift.",
        button: "Claim my gift",
      },
      {
        type: "finale",
        headline: `Happy Birthday, ${n}!`,
        subline: `Your gift has been released: a whole new year. Signed, the Gift Department (a.k.a. ${s}).`,
      },
    ];
  },
};
