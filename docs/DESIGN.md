# The Game: design

## Concept
A birthday surprise disguised as a gift. The receiver opens a link, accepts some "conditions", and gets pulled
into a loop of escalating, absurd and slightly creepy steps, until everything collapses into a happy birthday
reveal with music, confetti, photos and a personal message.

**Tone rule:** playfully weird, never truly scary or harmful. No fake bank charges, no password prompts, no
long-lasting "you've been hacked" panic. There is always a hidden way to skip straight to the surprise.

## Brand
Noir and minimal: warm black, bone-white text, one yellow accent (the cat's eyes) and a touch of ribbon red.
Headlines in Instrument Serif, everything else in Inter. The mark is a pair of glowing cat eyes that blink
and follow the pointer.

## Sender flow
A step-by-step creator, one question per screen, with a progress bar, Back, and Skip on optional steps:
1. Which prank? (skipped when a game was picked on the home page)
2. Who's the birthday? (name, optional age, your name)
3. Photos (optional, up to 3; "Restyle" appears only when photo transforms are switched on)
4. Your voice (one big mic button, "Hear it creepy" preview, optional creepy line)
5. Inside jokes (optional, up to 3)
6. Your message
7. When should it open? Right away, or on their birthday (sealed with a countdown)

Then: copy the link, share it (system share sheet or WhatsApp) or preview it.

## Receiver flow (shared skeleton)
`gate` (tap unlocks sound) → `voice note` (normal, then cut off) → game-specific escalation →
`glitch` (voice distorted) → `blackout` (silence, then a whisper) → `finale-gate` → `finale`.

## Building blocks (stages)
| Stage | What it does |
|---|---|
| gate | The "gift" screen. First tap unlocks audio on phones. |
| voice | Plays the sender's voice with an effect, optionally "interrupted". |
| chat | Scripted conversation (agent chat or ghost text) with choices, free input, voice cues, sfx. |
| terms | Absurd Terms & Conditions with inside jokes; the Decline button runs away. |
| loading | Endless loading bar: 99%, "Recalculating…", back down, then done. |
| captcha | "Select all images of {name} being dramatic", using the sender's photos. Always fails twice. |
| glitch | Full-screen breakdown with distorted voice, static and vibration. |
| news | Fake breaking-news broadcast about the birthday person: fictional channel, LIVE badge, their photo "on the scene", headline bar, ticker built from inside jokes, a news jingle, an anchor voice (the device's built-in text-to-speech) with captions, and an optional live poll. The Haunting's version ends with the anchor's voice dropping deep and slow; Secret Admirer shows the blurred "suspect". |
| blackout | Black screen, silence, then a whisper. |
| candles | Light the candles, make a wish, they blow out. |
| reveal | Blurred photo with clues, then "connection lost". |
| finale-gate | "Final step: press to claim" (also re-unlocks audio). |
| finale | Confetti, voice note (normal), birthday song, photos, typed message, replay buttons. |

## Voice effects (Web Audio, in the browser)
normal · warm (light reverb) · deep (slowed, low-passed, reverb) · demon (pitched way down, distorted,
doubled) · reverse · stutter (random chopped slices + static) · whisper (filtered fragment, panning, big
reverb) · radio · disguise (sped-up "anonymous" voice). Output is compressed and capped so the scary parts
are creepy, not ear-blasting.

## Privacy & safety
- Surprise ids are random and unguessable; play pages are `noindex`.
- Link previews never spoil the surprise (each game has a neutral share title).
- Only media uploaded through the app can be referenced by a surprise.
- Prompt transforms ask for recognizable, wholesome edits and block obviously harmful prompts.
- The create page reminds senders to only use photos and voices of people who'd be okay with it.

## Roadmap
- **v1 (done):** engine, create page (photos, voice, message, lock date), finale, 3 games.
- **v2:** OpenRouter key on Vercel for photo transforms; personalized dialogue and roasts generated from the
  sender's inside jokes; usage limits per link.
- **v3:** remaining 7 games; live selfie twist during the game; receiver records a thank-you reply;
  auto-delete media after the birthday; more languages.
