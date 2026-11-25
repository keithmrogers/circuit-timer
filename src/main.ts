import "./style.css";
import { MOVES } from "./moves";
import { buildPlan, DEFAULTS, totalSeconds, type Phase, type Settings } from "./plan";
import { Sounds } from "./sounds";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const RING = 2 * Math.PI * 52;

let plan: Phase[] = [];
let index = 0;
let endsAt = 0; // Date.now() when the current phase ends
let pausedLeft: number | null = null; // ms left, while paused
let lastShown = -1;
let timer: number | undefined;
let wakeLock: { release(): Promise<void> } | null = null;
const sounds = new Sounds();

function readSettings(): Settings {
  const val = (name: string) =>
    (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement | null)?.value;
  return {
    ...DEFAULTS,
    rounds: Number(val("rounds") ?? DEFAULTS.rounds),
    workSeconds: Number(val("work") ?? DEFAULTS.workSeconds),
  };
}

function showScreen(name: "setup" | "run" | "done") {
  document.body.dataset.screen = name;
  for (const id of ["setup", "run", "done"]) $(id).hidden = id !== name;
}

function updateTotal() {
  const minutes = Math.round(totalSeconds(buildPlan(readSettings())) / 60);
  $("total").textContent = `About ${minutes} minutes`;
}

function renderMoveList() {
  $("move-list").innerHTML = MOVES.map(
    (m) =>
      `<li><svg viewBox="0 0 160 92" aria-hidden="true">${m.art}</svg><span>${m.name}</span></li>`,
  ).join("");
}

function nextWorkAfter(i: number): Phase | undefined {
  return plan.slice(i + 1).find((p) => p.kind === "work" || p.kind === "cool-down");
}

function enterPhase(i: number) {
  index = i;
  const phase = plan[i];
  endsAt = Date.now() + phase.seconds * 1000;
  pausedLeft = null;
  lastShown = -1;

  document.body.dataset.phase = phase.kind;
  $("move-name").textContent = phase.move.name;
  $("cue").textContent = phase.move.cue;
  const art = $("art") as unknown as SVGSVGElement;
  art.innerHTML = phase.move.art;
  art.setAttribute("aria-label", `Drawing of ${phase.move.name}`);

  const rounds = plan.filter((p) => p.kind === "work").reduce((n, p) => Math.max(n, p.round ?? 0), 0);
  $("round").textContent = phase.round ? `Round ${phase.round} of ${rounds}` : "";
  $("step").textContent = `${i + 1} / ${plan.length}`;
  ($("overall-bar").style.width = `${(i / plan.length) * 100}%`);

  const next = nextWorkAfter(i);
  $("next").textContent = next ? `Next: ${next.move.name}` : "Last one!";
  $("pause").textContent = "Pause";

  if (phase.kind === "rest" && next) sounds.say(`Rest. Next, ${next.move.name}.`);
  else if (phase.kind !== "ready") sounds.say(phase.move.name);
  if (i > 0) sounds.go();

  render();
}

function render() {
  const phase = plan[index];
  const left = pausedLeft ?? Math.max(0, endsAt - Date.now());
  const shown = Math.ceil(left / 1000);
  if (shown !== lastShown) {
    $("seconds").textContent = String(shown);
    if (pausedLeft === null && shown > 0 && shown <= 3 && lastShown !== -1) sounds.tick();
    lastShown = shown;
  }
  const fraction = phase.seconds > 0 ? left / (phase.seconds * 1000) : 0;
  $("ring").style.strokeDashoffset = String(RING * (1 - fraction));
}

function tick() {
  if (pausedLeft !== null) return;
  if (Date.now() >= endsAt) {
    if (index + 1 < plan.length) enterPhase(index + 1);
    else finish();
    return;
  }
  render();
}

async function keepAwake() {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request(t: "screen"): Promise<{ release(): Promise<void> }> } };
    wakeLock = (await nav.wakeLock?.request("screen")) ?? null;
  } catch {
    wakeLock = null; // not supported or not allowed: the screen may sleep
  }
}

function letSleep() {
  wakeLock?.release().catch(() => undefined);
  wakeLock = null;
}

function start() {
  sounds.enabled = ($("sound") as HTMLInputElement).checked;
  sounds.unlock(); // inside the tap, so iPad lets us play sound
  plan = buildPlan(readSettings());
  showScreen("run");
  enterPhase(0);
  window.clearInterval(timer);
  timer = window.setInterval(tick, 100);
  void keepAwake();
}

function stop() {
  window.clearInterval(timer);
  timer = undefined;
  sounds.quiet();
  letSleep();
  delete document.body.dataset.phase;
}

function finish() {
  stop();
  sounds.done();
  const s = readSettings();
  $("done-summary").textContent = `You did ${s.rounds} ${s.rounds === 1 ? "round" : "rounds"} of ${MOVES.length} moves.`;
  showScreen("done");
}

function togglePause() {
  if (pausedLeft === null) {
    pausedLeft = Math.max(0, endsAt - Date.now());
    $("pause").textContent = "Go";
    sounds.quiet();
  } else {
    endsAt = Date.now() + pausedLeft;
    pausedLeft = null;
    $("pause").textContent = "Pause";
  }
  render();
}

function skip() {
  if (index + 1 < plan.length) enterPhase(index + 1);
  else finish();
}

$("start").addEventListener("click", start);
$("pause").addEventListener("click", togglePause);
$("skip").addEventListener("click", skip);
$("quit").addEventListener("click", () => {
  stop();
  showScreen("setup");
});
$("again").addEventListener("click", () => showScreen("setup"));
document.querySelectorAll('input[name="rounds"], input[name="work"]').forEach((el) =>
  el.addEventListener("change", updateTotal),
);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && timer !== undefined) void keepAwake();
});

renderMoveList();
updateTotal();
showScreen("setup");
