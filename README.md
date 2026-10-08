# Sparkle Smile

A 3D tooth-brushing game for young kids (around age 5), made for phones and tablets.

You look out from inside a mouth. Food flies in and sticks to the teeth. If it stays there, germs arrive with pickaxes and drills and dig black holes. Drag a finger (or move the mouse) back and forth over a tooth to brush it:

- Brushing zaps the germs first, then scrubs off the food.
- A clean tooth gets a bubble shield for a while, and germs can't touch it. A shielded tooth slowly heals and its holes fill back in.
- Sweets are the worst: they stick hardest, call germs fastest and do the most damage. Fruit, veggies and cheese brush off easily and attract only a germ or two.
- Toothpaste runs out. Tap the tube to refill it.
- A tooth with too many holes falls out.
- A round lasts 2 minutes, like real brushing, and ends with 1 to 3 stars.

**Play:** https://tb-x.github.io/sparkle-smile/

## Running locally

It is one `index.html` plus the sound clips in `assets/`, with no build step. [three.js](https://threejs.org/) r128 loads from cdnjs. Serve the folder over HTTP, for example:

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

On iPhone, turn the silent switch off to hear the sounds and the voice. Opened straight from disk the game still works, but the browser won't load the clips, so you hear the built-in synthesized sounds and the device's own voice instead.

## Play offline (add to Home Screen)

On iPhone or iPad, open the game in Safari, tap **Share → Add to Home Screen**, then open it once from the new icon while online. After that it starts full screen and works without internet. Changes I publish arrive on their own: the next online launch downloads them and the one after shows them.

(How: `manifest.webmanifest` gives the icon and full-screen mode; `sw.js`, a service worker, keeps a copy of every file the game uses, including three.js, the font and the sound clips.)

## Tuning

The difficulty knobs are at the top of the script: `ROUND_TIME`, `SHIELD_TIME`, `HEAL_RATE`, `BRUSH_POWER`, `PASTE_USE`. Each food's `sugar` and `sticky` values are in `FOOD_TYPES`.

The sound knobs are at the top of the sound section:

- `CLIP_VOL` and `VOICE_VOL`: how loud the sound effects and the spoken lines are (0 to 1).
- `CLIP_TRIM` and `BRUSH_TRIM`: per-clip volume trims that even out the clips, which ElevenLabs made at very different levels. Lower a number if a sound is too loud.
- `TOOL_CLIP_GAP`: the shortest gap between germ pickaxe and drill sounds, so a crowd of germs doesn't get noisy.
- `ASSET_V`: bump it after replacing any file in `assets/`, so phones don't keep the old one.

## Audio credits

Voices and sounds: [elevenlabs.io](https://elevenlabs.io). All clips were made on 2026-10-08 with an ElevenLabs **free** plan, so they may only be used non-commercially and must credit ElevenLabs. They are not covered by any licence on this game's code.

- **Spoken lines** (`assets/say-*.mp3`, 15 clips): voice "Will", model Eleven Multilingual v2. The start line, the sweets and healthy-food lines (apple, carrot, broccoli, cheese), germs, bubble shield, healing, ouch, tooth fell out, the two toothpaste reminders, and the two end lines.
- **Sound effects** (`assets/sfx-*.mp3`, 14 clips): ElevenLabs Sound Effects. Food whoosh, splat, germ pop, clean swish, sparkle ding, germ giggle, bonk, pickaxe tink, tiny drill, tooth clunk, shield fizz, toothpaste squeeze, victory fanfare, and the looping brushing sound.
