// Bootstraps the game and wires the top-bar buttons.
import { Game } from "./engine.js";

const root = document.querySelector("#game");
const game = new Game(root);
window.__game = game; // handy for debugging in the console

const hasSave = !!localStorage.getItem("promotion-season-save");
const resumeBtn = document.querySelector("#btn-resume");
if (hasSave) resumeBtn.hidden = false;

resumeBtn?.addEventListener("click", () => game.load());
document.querySelector("#btn-restart")?.addEventListener("click", () => {
  if (confirm("Restart from Day 1? Your current run will be lost.")) game.reset();
});
