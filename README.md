# The Game 🎁

**Prank them. Then make their day.**

The Game lets you send a birthday "gift" link to a friend, partner or family member. When they open it, it
pulls them into a strange, escalating game built from *your* photos, *your* inside jokes and *your* voice
(which slowly turns creepy), and it always ends with a big, happy birthday surprise: confetti, the birthday
song, your photos and your message.

## How it works

1. **Pick a game.** Each one is a different trap with a different twist.
2. **Make it personal.** Add their name, inside jokes, up to 3 photos (each can be transformed with a prompt),
   a voice note, an optional creepy line and your birthday message. You can also lock the link until their birthday.
3. **Send the link.** Say nothing. 😈

### The voice arc
Your voice note plays **normally** when they open the gift (then gets "interrupted"), comes back **twisted** in
the middle (deep, demonic, backwards, glitching, whispering), and plays **normally and warmly** again at the
finale before the birthday song. All effects run live in the browser with the Web Audio API.

## Games

| Game | Status | The trick | The reveal |
|---|---|---|---|
| 📦 The Gift Department | ✅ Playable | Absurd terms, endless loading, a polite agent who slowly loses it | The paperwork was a birthday card |
| 🕯️ The Haunting | ✅ Playable | A ghost takes over the screen; your voice comes back wrong | The ghost just wanted to sing happy birthday |
| 💌 Secret Admirer | ✅ Playable | Anonymous messages that get a little too intense | It was you all along |
| 💻 System Breach | Coming soon | Fake device takeover by a "hacker" | Final demand: accept being a year older |
| 🎰 You Won! | Coming soon | A rigged prize claim | The real prize is your message |
| 🕵️ The Case File | Coming soon | "You are a suspect" | The crime: getting older |
| 🔐 Locked In | Coming soon | A digital escape room | The last door opens onto the party |
| 📊 Performance Review | Coming soon | A cold HR review of their year | Promoted to the next age |
| 🚀 Mission Control | Coming soon | A launch that keeps failing | Lift-off into a new year |
| 🎤 The Rigged Quiz Show | Coming soon | A host who roasts every answer | The jackpot is the surprise |

Every game takes 3–5 minutes, has a hidden 🎈 "skip to the surprise" button, and always ends happy.

## Tech

- [Next.js](https://nextjs.org) (App Router, TypeScript), deployed on [Vercel](https://vercel.com)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for photos, voice notes and saved surprises
- [OpenRouter](https://openrouter.ai) for "transform my photo with a prompt" (optional)
- Web Audio API for voice effects, sound effects and the synthesized birthday song: no audio files needed

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: add OPENROUTER_API_KEY
npm run dev                  # http://localhost:3000
```

Without `BLOB_READ_WRITE_TOKEN`, files are saved to `./.data` (local development only).
Without `OPENROUTER_API_KEY`, everything works and the original photos are used.

## Deploy to Vercel

1. Import this repository in Vercel (framework: Next.js, no extra settings).
2. **Storage → Create → Blob**, and connect it to the project. This adds `BLOB_READ_WRITE_TOKEN` automatically.
3. **Settings → Environment Variables**: add `OPENROUTER_API_KEY` (and optionally `OPENROUTER_IMAGE_MODEL`,
   `NEXT_PUBLIC_SITE_URL`).
4. Redeploy.

Never commit API keys. They only live in Vercel's environment variables (or your local `.env.local`).

## Project structure

```
app/
  page.tsx                 landing page + game picker
  create/[game]/page.tsx   sender: personalize a game
  play/[id]/page.tsx       receiver: plays the surprise
  api/upload               stores a photo or voice clip
  api/transform            photo + prompt → new image (OpenRouter)
  api/surprise             saves a finished surprise, returns its id
  api/media/[...key]       serves local files in development
components/
  creator/                 form, photo slots, voice recorder
  player/                  game engine, stages, finale, confetti
games/                     one script per game (list of stages)
lib/
  client/audio-engine.ts   voice effects, sound effects, birthday song
  games.ts                 game catalog
  storage.ts               Vercel Blob / local storage
  validate.ts              input validation
docs/DESIGN.md             product design and roadmap
```

### Adding a new game
Write a script in `games/` that returns a list of stages (gate, chat, terms, loading, captcha, glitch,
blackout, candles, reveal, finale-gate, finale), register it in `games/index.ts`, and set `available: true`
in `lib/games.ts`.
