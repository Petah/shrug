# Promotion Season

A narrative, choice-based office-sabotage game. **Game jam theme: sabotage.**

> A single promotion is up for grabs. Everyone is pretending to be professional.
> Can you win without becoming the worst person in the room?

You're an ambitious employee at a dysfunctional company. Over **5 in-game days**
you read the office mood, make moves, and live with the consequences — juggling
**Reputation, Suspicion, Stress, Allies, and Chaos** while five sharply-drawn
rivals scheme right back at you. There are **6 endings**, from a Clean Promotion
to becoming someone else's Scapegoat.

## Run it

No build step, no dependencies. Either:

```bash
npm start          # generates placeholder art, then serves at http://localhost:5173
```

or just open `index.html` in a browser (it's plain ES modules — works off the
filesystem in most browsers; if yours blocks `file://` modules, use `npm run serve`).

## Scripts (Node, zero dependencies)

| Command | What it does |
| --- | --- |
| `npm run placeholders` | Regenerates an SVG placeholder for every entry in `assets/images.json`, each stamped with a description of the art to draw. |
| `npm run validate` | Validates the story graph: no dangling links, unknown images/speakers, bad stat keys, or unreachable scenes. |
| `npm run serve` | Static file server at `http://localhost:5173`. |
| `npm run build` | `placeholders` + `validate`. |

## Project layout

```
index.html              # three-panel layout: inbox · scene · stats
css/styles.css          # all styling
js/story.js             # ALL game content (scenes, choices, endings) — pure data
js/engine.js            # rendering, stat math, save/load, keyboard shortcuts
js/main.js              # bootstrap
assets/images.json      # image manifest (id, size, and what each image should show)
assets/images/*.svg     # generated placeholders — replace with real art
scripts/*.mjs           # placeholder generator, story validator, dev server
```

## Adding / editing story content

Everything lives in `js/story.js`. A scene looks like:

```js
d2_priya: {
  day: 2, phase: "work", speaker: "priya",
  title: "Priya asks a favor",
  body: "Can you review my section before the demo?…",
  choices: [
    {
      text: "Give honest, helpful feedback.",
      hint: "Priya gets even better. You gain a real ally.",
      effects: { chaos: -1 },         // stat deltas
      rel: { priya: 2 },              // relationship deltas (-5..+5)
      set: ["helpedPriya"],           // flags to remember
      next: "d2_credit",
      // require: { flag: "..." }     // optional gate; locked choices show why
    },
  ],
}
```

Gates supported by `require`: `flag`, `notFlag`, `anyFlag`, `minRel: [who, n]`,
`minAllies`, `minStress`. Endings live in `ENDINGS` and are checked top-to-bottom;
the first whose `when(state)` is true wins (last one is an unconditional fallback).

**After any edit, run `npm run validate`** to catch broken links before they ship.

## Replacing the placeholder art

1. Open `assets/images.json` — each entry has a `description` of what to draw.
2. Create the real image and save it over the matching file in `assets/images/`
   (keep the filename, or update `file` in the manifest — `.png`/`.jpg` are fine).

That's it. The game references images by manifest `id`, so nothing else changes.
