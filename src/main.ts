import "./style.css";
import { buildPlan, totalSeconds, type Choices, type Phase } from "./plan";
import { findRoutine, ROUTINES, type Routine } from "./routines";
import { Sounds } from "./sounds";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const RING = 2 * Math.PI * 52;
const STORAGE_KEY = "circuit-timer:routine";

let routine: Routine = ROUTINES[0];
let plan: Phase[] = [];
let index = 0;
let endsAt = 0; // Date.now() when the current phase ends
let pausedLeft: number | null = null; // ms left, while paused
let lastShown = -1;
let switched = false; // "Switch sides" said for this phase
let timer: number | undefined;
let wakeLock: { release(): Promise<void> } | null = null;
const sounds = new Sounds();

// ---------- routine choice (URL ?routine= wins, then the last one used) ----------

function savedRoutineId(): string | null {
  const fromUrl = new URLSearchParams(location.search).get("routine");
  if (findRoutine(fromUrl)) return fromUrl;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveRoutineId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode: just don't remember */
  }
}

function radios(container: HTMLElement, name: string, values: number[], checked: number, label: (v: number) => string) {
  container.innerHTML = values
    .map(
      (v) =>
        `<label><input type="radio" name="${name}" value="${v}"${v === checked ? " checked" : ""} /><span>${label(v)}</span></label>`,
    )
    .join("");
}

function selectRoutine(r: Routine) {
  routine = r;
  saveRoutineId(r.id);
  document.body.dataset.routine = r.id;
  document.body.style.setProperty("--accent", r.theme.accent);
  document.body.style.setProperty("--accent-soft", r.theme.soft);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", r.theme.accent);
  document.title = r.name;

  $("setup-title").textContent = r.name;
  $("tagline").textContent = r.tagline;
  $("equipment").textContent = r.equipment ? `You'll need: ${r.equipment}` : "";
  $("equipment").hidden = !r.equipment;

  radios($("rounds-choices"), "rounds", r.roundsOptions, r.defaultRounds, String);
  radios($("work-choices"), "work", r.workOptions, r.defaultWork, (v) => `${v} sec`);
  document
    .querySelectorAll('input[name="rounds"], input[name="work"]')
    .forEach((el) => el.addEventListener("change", updateTotal));

  $("move-list").innerHTML = r.moves
    .map((m) => `<li><svg viewBox="0 0 160 92" aria-hidden="true">${m.art}</svg><span>${m.name}</span></li>`)
    .join("");

  for (const input of document.querySelectorAll<HTMLInputElement>('input[name="routine"]')) {
    input.checked = input.value === r.id;
  }
  updateTotal();
}

function renderRoutineList() {
  $("routine-list").innerHTML = ROUTINES.map(
    (r) =>
      `<label class="routine" style="--accent:${r.theme.accent};--accent-soft:${r.theme.soft}">` +
      `<input type="radio" name="routine" value="${r.id}" />` +
      `<span><b>${r.name}</b><small>${r.moves.length} moves</small></span></label>`,
  ).join("");
  for (const input of document.querySelectorAll<HTMLInputElement>('input[name="routine"]')) {
    input.addEventListener("change", () => {
      const r = findRoutine(input.value);
      if (r) selectRoutine(r);
    });
  }
}

function readChoices(): Choices {
  const val = (name: string) =>
    (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement | null)?.value;
  return {
    rounds: Number(val("rounds") ?? routine.defaultRounds),
    workSeconds: Number(val("work") ?? routine.defaultWork),
  };
}

function updateTotal() {
  const minutes = Math.round(totalSeconds(buildPlan(routine, readChoices())) / 60);
  $("total").textContent = `About ${minutes} minutes`;
}

// ---------- the workout ----------

function showScreen(name: "setup" | "run" | "done") {
  document.body.dataset.screen = name;
  for (const id of ["setup", "run", "done"]) $(id).hidden = id !== name;
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
  switched = false;

  document.body.dataset.phase = phase.kind;
  $("move-name").textContent = phase.move.name;
  $("cue").textContent = phase.move.cue;
  $("switch").hidden = true;
  const art = $("art") as unknown as SVGSVGElement;
  art.innerHTML = phase.move.art;
  art.setAttribute("aria-label", `Drawing of ${phase.move.name}`);

  const rounds = plan.reduce((n, p) => Math.max(n, p.round ?? 0), 0);
  $("round").textContent = phase.round ? `Round ${phase.round} of ${rounds}` : "";
  $("step").textContent = `${i + 1} / ${plan.length}`;
  $("overall-bar").style.width = `${(i / plan.length) * 100}%`;

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
  if (phase.move.switchHalfway && !switched && left <= (phase.seconds * 1000) / 2) {
    switched = true;
    $("switch").hidden = false;
    sounds.say("Switch sides");
    sounds.go();
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
  plan = buildPlan(routine, readChoices());
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
  const { rounds } = readChoices();
  $("done-summary").textContent =
    `You did ${rounds} ${rounds === 1 ? "round" : "rounds"} of ${routine.moves.length} moves.`;
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
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && timer !== undefined) void keepAwake();
});

renderRoutineList();
selectRoutine(findRoutine(savedRoutineId()) ?? ROUTINES[0]);
showScreen("setup");
