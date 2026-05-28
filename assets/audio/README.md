# Voice / SFX

By default the game **synthesizes** a short voice "blip" per spoken line using
the Web Audio API — no files needed. Each character has a different pitch
(set via `voice` in `js/story.js`).

To use **real recordings**, note that **every spoken line has its own clip** —
not one per character. The list of lines lives in `voices.json`, generated from
the story:

```bash
npm run voices   # (re)generate voices.json from js/story.js
```

Each entry looks like:

```json
{ "key": "d1_morning:1", "speaker": "dana",
  "text": "One of you will be promoted…", "file": "" }
```

Record the clip, drop it in this folder, and put its filename in `file`:

```json
{ "key": "d1_morning:1", "speaker": "dana",
  "text": "One of you will be promoted…", "file": "dana-line-01.mp3" }
```

- `key` is `sceneId:beatIndex` — leave it as generated; it's how the engine
  matches a clip to a line.
- Any line with `"file": ""` falls back to the synth blip, so you can add voices
  one at a time.
- Re-running `npm run voices` **keeps the filenames you've already set**, adds
  entries for new lines, and drops lines that no longer exist.
