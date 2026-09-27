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

It is a single `index.html` with no build step. [three.js](https://threejs.org/) r128 loads from cdnjs. Serve the folder over HTTP, for example:

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

On iPhone, turn the silent switch off to hear the sounds and the voice.

## Tuning

The difficulty knobs are at the top of the script: `ROUND_TIME`, `SHIELD_TIME`, `HEAL_RATE`, `BRUSH_POWER`, `PASTE_USE`. Each food's `sugar` and `sticky` values are in `FOOD_TYPES`.
