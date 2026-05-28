// As Per My Last Email — browser game engine.
// Renders scenes into the three-panel layout and applies choice effects.
import { SCENES, ENDINGS, CHARACTERS, STAT_DEFS, START_STATE, INBOX, matches } from "./story.js";
import { playVoice } from "./audio.js";

// Maps image id -> file path. Populated from assets/images.json via
// setImageMap() so real art (any extension) can replace the .svg placeholders.
let IMAGE_FILES = {};
export function setImageMap(map) {
  IMAGE_FILES = map || {};
}
const IMG = (id) => IMAGE_FILES[id] || `assets/images/${id}.svg`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const SAVE_KEY = "promotion-season-save";

export class Game {
  constructor(root) {
    this.root = root;
    this.el = {
      bg: root.querySelector("#scene-bg"),
      sprite: root.querySelector("#sprite"),
      inbox: root.querySelector("#inbox"),
      stage: root.querySelector("#stage"),
      stats: root.querySelector("#stats"),
      rel: root.querySelector("#relationships"),
      dayLabel: document.querySelector("#day-label"),
    };
    this.reset();
  }

  reset() {
    this.state = {
      stats: { ...START_STATE.stats },
      rel: { ...START_STATE.rel },
      flags: new Set(),
      day: 0,
      snapshot: null, // stats at start of current day, for the recap
    };
    this.history = [];
    this.go("start");
  }

  // ── State mutation ──────────────────────────────────────────
  apply(choice) {
    const before = JSON.parse(JSON.stringify({ stats: this.state.stats, rel: this.state.rel }));
    for (const [k, v] of Object.entries(choice.effects ?? {})) {
      const max = STAT_DEFS.find((s) => s.key === k)?.max ?? 10;
      this.state.stats[k] = clamp((this.state.stats[k] ?? 0) + v, 0, max);
    }
    for (const [k, v] of Object.entries(choice.rel ?? {})) {
      this.state.rel[k] = clamp((this.state.rel[k] ?? 0) + v, -5, 5);
    }
    for (const f of choice.set ?? []) this.state.flags.add(f);
    return before;
  }

  pickEnding() {
    return ENDINGS.find((e) => e.when(this.state)) ?? ENDINGS.at(-1);
  }

  // ── Navigation ──────────────────────────────────────────────
  go(id) {
    if (id === "__ending__") return this.renderEnding(this.pickEnding());
    const scene = SCENES[id];
    if (!scene) throw new Error(`Unknown scene: ${id}`);
    this.current = id;

    // Day bookkeeping: snapshot stats when a new day's morning begins.
    if (scene.day && scene.day !== this.state.day) this.state.day = scene.day;
    if (scene.phase === "morning") this.state.snapshot = JSON.parse(JSON.stringify(this.state.stats));

    this.save();
    this.renderSidebars(scene);
    this.renderScene(scene);
  }

  choose(choice) {
    if (!matches(choice.require, this.state)) return;
    this.apply(choice);
    this.go(choice.next);
  }

  setBg(imageId) {
    const next = IMG(imageId);
    if (this.el.bg.getAttribute("src") === next) return;
    this.el.bg.classList.remove("bg-in");
    void this.el.bg.offsetWidth; // restart the cross-fade
    this.el.bg.src = next;
    this.el.bg.classList.add("bg-in");
  }

  // ── Rendering: center stage (beat-by-beat dialogue) ─────────
  renderScene(scene) {
    // The scene image is a full-bleed background. Only swap it when the scene
    // specifies one, so work beats keep the day's establishing shot behind them.
    if (scene.image) this.setBg(scene.image);
    this.scene = scene;
    this.beats = scene.beats && scene.beats.length ? scene.beats : [{ text: "" }];
    this.beatIndex = 0;
    this.renderBeat();
  }

  // Renders the current beat: narration shows plainly; a spoken beat pops the
  // speaker's cut-out and plays their voice. The last beat reveals the choices
  // (or the auto-continue), so the player clicks through dialogue first.
  renderBeat() {
    const stage = this.el.stage;
    stage.classList.remove("fade-in");
    void stage.offsetWidth;
    stage.classList.add("fade-in");

    const scene = this.scene;
    const beat = this.beats[this.beatIndex];
    const isLast = this.beatIndex >= this.beats.length - 1;
    const speaker = beat.speaker ? CHARACTERS[beat.speaker] : null;

    this.setSprite(speaker);
    if (speaker) playVoice({ key: `${this.current}:${this.beatIndex}`, voice: speaker.voice });

    const nameplate = speaker ? `<div class="nameplate"><b>${escapeHtml(speaker.name)}</b><i>${escapeHtml(speaker.title)}</i></div>` : "";
    const lineCls = speaker ? "line spoken" : "line narration";
    const lineHtml = beat.text ? `<p class="${lineCls}">${escapeHtml(beat.text)}</p>` : "";

    const controls = isLast
      ? this.endControlsHtml(scene)
      : `<div class="choices"><button class="choice continue" data-next-beat><span class="ctext">Continue ▸</span></button></div>`;

    stage.innerHTML = `
      <div class="scene-body">
        <h2>${escapeHtml(scene.title)}</h2>
        ${nameplate}
        ${lineHtml}
        ${controls}
      </div>`;

    this.wireStage(scene, isLast);
  }

  // HTML for the controls shown after the final beat: choices, or auto-continue.
  endControlsHtml(scene) {
    if (scene.choices) {
      return (
        `<div class="choices">` +
        scene.choices
          .map((c, i) => {
            const ok = matches(c.require, this.state);
            const hint = c.hint ? `<i class="hint">${escapeHtml(c.hint)}</i>` : "";
            const lock = ok ? "" : `<span class="lock" title="Conditions not met">🔒 ${lockReason(c.require)}</span>`;
            return `<button class="choice ${ok ? "" : "locked"}" data-i="${i}" ${ok ? "" : "disabled"}>
              <span class="num">${i + 1}</span>
              <span class="ctext">${escapeHtml(c.text)} ${lock}${hint}</span>
            </button>`;
          })
          .join("") +
        `</div>`
      );
    }
    if (scene.auto) {
      const label = scene.phase === "title" ? "Begin" : "Continue →";
      return `<div class="choices"><button class="choice continue" data-auto="${scene.auto}"><span class="ctext">${label}</span></button></div>`;
    }
    return "";
  }

  wireStage(scene, isLast) {
    const stage = this.el.stage;
    stage.querySelectorAll("button.choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.nextBeat != null) {
          this.beatIndex++;
          return this.renderBeat();
        }
        if (btn.dataset.auto != null) return this.go(btn.dataset.auto);
        const c = scene.choices[Number(btn.dataset.i)];
        if (!c) return;
        this.flashDeltas(c);
        this.choose(c);
      });
    });

    // Keyboard: advance beats with Enter/Space; pick choices with number keys.
    this._keyHandler && document.removeEventListener("keydown", this._keyHandler);
    this._keyHandler = (e) => {
      if (!isLast) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.beatIndex++;
          this.renderBeat();
        }
        return;
      }
      if (scene.choices) {
        const n = Number(e.key);
        if (n >= 1 && n <= scene.choices.length) {
          const c = scene.choices[n - 1];
          if (matches(c.require, this.state)) {
            this.flashDeltas(c);
            this.choose(c);
          }
        }
      } else if (scene.auto && (e.key === "Enter" || e.key === " ")) {
        this.go(scene.auto);
      }
    };
    document.addEventListener("keydown", this._keyHandler);
  }

  // Show/hide the speaking character's full-body cut-out, popping on change.
  setSprite(speaker) {
    const el = this.el.sprite;
    if (!el) return;
    if (!speaker) {
      el.classList.add("hidden");
      el.classList.remove("pop");
      this._spriteId = null;
      return;
    }
    el.src = IMG(speaker.sprite);
    el.alt = speaker.name;
    el.classList.remove("hidden");
    if (this._spriteId !== speaker.sprite) {
      el.classList.remove("pop");
      void el.offsetWidth;
      el.classList.add("pop");
    }
    this._spriteId = speaker.sprite;
  }

  renderEnding(ending) {
    document.removeEventListener("keydown", this._keyHandler);
    clearSave();
    this.setSprite(null);
    const stage = this.el.stage;
    stage.classList.add("fade-in");
    this.setBg(ending.image);
    const body = ending.body.split("\n\n").map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    const s = this.state.stats;
    stage.innerHTML = `
      <div class="scene-body ending">
        <div class="ending-tag">ENDING</div>
        <h2>${escapeHtml(ending.title)}</h2>
        ${body}
        <div class="final-stats">
          Reputation ${s.reputation} · Suspicion ${s.suspicion} · Allies ${s.allies} · Chaos ${s.chaos}
        </div>
        <div class="choices"><button class="choice continue" id="replay"><span class="ctext">↺ Play again</span></button></div>
      </div>`;
    stage.querySelector("#replay").addEventListener("click", () => this.reset());
    this.renderSidebars({ day: 5 });
  }

  // ── Rendering: side panels ──────────────────────────────────
  renderSidebars(scene) {
    this.el.dayLabel.textContent = scene.day ? `Day ${scene.day} of 5` : "As Per My Last Email";

    // Inbox (left).
    const msgs = INBOX[scene.day] ?? [];
    this.el.inbox.innerHTML =
      `<h3>Inbox</h3>` +
      (msgs.length
        ? msgs
            .map(
              (m) => `<div class="mail">
                <div class="mail-from">${escapeHtml(m.from)}</div>
                <div class="mail-subj">${escapeHtml(m.subject)}</div>
                <div class="mail-prev">${escapeHtml(m.preview)}</div>
              </div>`
            )
            .join("")
        : `<div class="mail empty">No new messages. Suspiciously quiet.</div>`);

    // Stats (right).
    const recapHtml = scene.phase === "recap" && this.state.snapshot ? this.deltaTable() : "";
    this.el.stats.innerHTML =
      `<h3>Your Standing</h3>` +
      STAT_DEFS.map((d) => {
        const v = this.state.stats[d.key];
        const pct = (v / d.max) * 100;
        const tone = toneFor(d.key, v, d.max);
        return `<div class="stat ${tone}" title="${escapeHtml(d.hint)}">
          <div class="stat-top"><span>${d.icon} ${d.label}</span><span class="stat-val">${v}</span></div>
          <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
        </div>`;
      }).join("") +
      recapHtml;

    // Relationships (right, lower).
    this.el.rel.innerHTML =
      `<h3>Coworkers</h3>` +
      Object.entries(CHARACTERS)
        .filter(([id]) => id !== "you")
        .map(([id, c]) => {
          const r = this.state.rel[id] ?? 0;
          return `<div class="rel">
            <img src="${IMG(c.img)}" alt="${c.name}">
            <div class="rel-info"><b>${c.name}</b><span class="rel-mood ${moodClass(r)}">${moodLabel(r)}</span></div>
          </div>`;
        })
        .join("");
  }

  deltaTable() {
    const rows = STAT_DEFS.map((d) => {
      const diff = this.state.stats[d.key] - this.state.snapshot[d.key];
      if (!diff) return "";
      const cls = diff > 0 ? "up" : "down";
      return `<li class="${cls}">${d.icon} ${d.label} ${diff > 0 ? "+" : ""}${diff}</li>`;
    }).filter(Boolean);
    if (!rows.length) return `<div class="recap-box"><h4>Today's changes</h4><p>Steady as she goes.</p></div>`;
    return `<div class="recap-box"><h4>Today's changes</h4><ul>${rows.join("")}</ul></div>`;
  }

  // Floating "+1 Reputation" style feedback on choice.
  flashDeltas(choice) {
    const parts = [];
    for (const [k, v] of Object.entries(choice.effects ?? {})) {
      const d = STAT_DEFS.find((s) => s.key === k);
      parts.push({ label: `${d.icon} ${d.label} ${v > 0 ? "+" : ""}${v}`, up: v > 0 });
    }
    for (const [k, v] of Object.entries(choice.rel ?? {})) {
      parts.push({ label: `${CHARACTERS[k].name} ${v > 0 ? "+" : ""}${v}`, up: v > 0 });
    }
    if (!parts.length) return;
    const wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    wrap.innerHTML = parts.map((p) => `<div class="toast ${p.up ? "up" : "down"}">${p.label}</div>`).join("");
    this.root.appendChild(wrap);
    setTimeout(() => wrap.remove(), 1600);
  }

  // ── Save / load ─────────────────────────────────────────────
  save() {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          current: this.current,
          stats: this.state.stats,
          rel: this.state.rel,
          flags: [...this.state.flags],
          day: this.state.day,
          snapshot: this.state.snapshot,
        })
      );
    } catch {}
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      if (!d.current || !SCENES[d.current]) return false;
      this.state = {
        stats: d.stats,
        rel: d.rel,
        flags: new Set(d.flags || []),
        day: d.day || 0,
        snapshot: d.snapshot || null,
      };
      this.go(d.current);
      return true;
    } catch {
      return false;
    }
  }
}

// ── helpers ───────────────────────────────────────────────────
function clearSave() {
  try {
    localStorage.removeItem("promotion-season-save");
  } catch {}
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function lockReason(require) {
  if (!require) return "";
  if (require.flag) return "needs earlier choice";
  if (require.anyFlag) return "needs leverage";
  if (require.minRel) return `needs ${require.minRel[0]}'s trust`;
  if (require.minAllies != null) return `needs ${require.minAllies}+ allies`;
  if (require.minStress != null) return "needs high stress";
  return "locked";
}

// Some stats are good high (reputation, allies), others bad high (suspicion, stress, chaos).
function toneFor(key, v, max) {
  const goodHigh = key === "reputation" || key === "allies";
  const ratio = v / max;
  if (goodHigh) return ratio >= 0.6 ? "good" : ratio <= 0.2 ? "bad" : "mid";
  return ratio >= 0.7 ? "bad" : ratio <= 0.3 ? "good" : "mid";
}

function moodLabel(r) {
  if (r >= 4) return "Devoted";
  if (r >= 2) return "Ally";
  if (r >= 1) return "Warm";
  if (r === 0) return "Neutral";
  if (r >= -1) return "Cool";
  if (r >= -3) return "Wary";
  return "Hostile";
}
function moodClass(r) {
  if (r >= 2) return "m-good";
  if (r <= -2) return "m-bad";
  return "m-mid";
}
