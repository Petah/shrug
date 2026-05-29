# As Per My Last Email

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
| `npm run voices` | Regenerates `assets/audio/voices.json` (one entry per spoken line), preserving filenames you've set. |
| `npm run serve` | Static file server at `http://localhost:5173`. |
| `npm run build` | `placeholders` + `voices` + `validate`. |
| `npm run build:site` | `build`, then assembles the deployable site into `dist/`. |
| `npm run deploy` | `build:site`, then `wrangler deploy` (Worker Static Assets). |

## Deploy (Cloudflare Worker — Static Assets)

The game is a static site hosted as a **Worker with Static Assets** (no Worker
script — the Worker just serves the files in `dist/`). The build regenerates
assets, validates the story graph, warns about any manifest file missing on
disk, and copies the runtime files (`index.html`, `css/`, `js/`, `assets/`) into
`dist/`. `wrangler.toml` sets the Worker name, account, and `[assets].directory`.

```bash
npx wrangler login        # first time only (or set CLOUDFLARE_API_TOKEN)
npm run deploy            # builds dist/ and runs `wrangler deploy`
```

`npm run deploy` runs `wrangler deploy`; the Worker name (`aspermylastemail`) and
account come from `wrangler.toml`. The site goes live at
`aspermylastemail.<your-subdomain>.workers.dev`. `npx` fetches Wrangler on demand.

**Custom domain:** dashboard → Workers & Pages → `aspermylastemail` → Settings →
Domains & Routes → Add custom domain. Not stored in the repo.

> Note: this is a *Worker*, not a *Pages* project — so use `wrangler deploy`, not
> `wrangler pages deploy`. The latter looks for a Pages project of the same name
> and reports it "doesn't exist".

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
  day: 2, phase: "work",
  title: "Gary asks a favor",
  beats: [                                   // played one click at a time
    { speaker: "priya", text: "Can you review my section before the demo?" },
    { text: "It is good. Too good." },        // no speaker = narration
  ],
  choices: [                                  // shown after the last beat
    {
      text: "Give honest, helpful feedback.",
      hint: "Gary gets even better. You gain a real ally.",
      effects: { chaos: -1 },         // stat deltas
      rel: { priya: 2 },              // relationship deltas (-5..+5)
      set: ["helpedGary"],            // flags to remember
      next: "d2_credit",
      // require: { flag: "..." }     // optional gate; locked choices show why
    },
  ],
}
```

> Internal ids stay stable when you rename a character's display name: the
> character key (`priya`), relationship key (`rel: { priya }`), and art ids
> (`portrait-priya`, `sprite-priya`) are independent of the shown name (set in
> `CHARACTERS[...].name` in `js/story.js`). A spoken beat uses `speaker: "<id>"`.

Gates supported by `require`: `flag`, `notFlag`, `anyFlag`, `minRel: [who, n]`,
`minAllies`, `minStress`. Endings live in `ENDINGS` and are checked top-to-bottom;
the first whose `when(state)` is true wins (last one is an unconditional fallback).

**After any edit, run `npm run validate`** to catch broken links before they ship.

## Replacing the placeholder art

1. Open `assets/images.json` — each entry has a `description` of what to draw.
2. Create the real image and save it over the matching file in `assets/images/`
   (keep the filename, or update `file` in the manifest — `.png`/`.jpg` are fine).

That's it. The game references images by manifest `id`, so nothing else changes.
