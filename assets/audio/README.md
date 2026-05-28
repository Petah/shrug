# Voice / SFX

By default the game **synthesizes** a short voice "blip" per spoken line using
the Web Audio API — no files needed, each character has a different pitch
(set via `voice` in `js/story.js`).

To use **real voice clips** instead, drop audio files here and create
`assets/audio/voices.json` mapping a speaker id to a filename:

```json
{
  "priya": "priya.mp3",
  "marcus": "marcus.mp3",
  "becky": "becky.mp3",
  "owen": "owen.mp3",
  "dana": "dana.mp3",
  "you": "you.mp3"
}
```

Any missing entry falls back to the synthesized blip, so you can add them one at
a time. Short clips (0.3–1s) work best as per-line "voice" cues.
