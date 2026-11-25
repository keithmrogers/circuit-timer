import { COOL_DOWN, MOVES, REST, WARM_UP, type Move } from "./moves";

export type PhaseKind = "ready" | "warm-up" | "work" | "rest" | "cool-down";

export interface Phase {
  kind: PhaseKind;
  move: Move;
  seconds: number;
  /** 1-based round, for work and rest phases. */
  round?: number;
}

export interface Settings {
  rounds: number;
  workSeconds: number;
  restSeconds: number;
}

export const DEFAULTS: Settings = { rounds: 2, workSeconds: 30, restSeconds: 20 };

const READY: Move = { ...REST, id: "ready", name: "Get ready", cue: "Find some floor space." };

/** Get ready, warm up, each move with a rest after it (a longer one between rounds), cool down. */
export function buildPlan(s: Settings): Phase[] {
  const plan: Phase[] = [
    { kind: "ready", move: READY, seconds: 5 },
    { kind: "warm-up", move: WARM_UP, seconds: 120 },
  ];
  for (let round = 1; round <= s.rounds; round++) {
    MOVES.forEach((move, i) => {
      plan.push({ kind: "work", move, seconds: s.workSeconds, round });
      const lastMove = i === MOVES.length - 1;
      if (lastMove && round === s.rounds) return; // straight into the cool down
      plan.push({
        kind: "rest",
        move: REST,
        seconds: lastMove ? Math.max(60, s.restSeconds) : s.restSeconds,
        round,
      });
    });
  }
  plan.push({ kind: "cool-down", move: COOL_DOWN, seconds: 60 });
  return plan;
}

export function totalSeconds(plan: Phase[]): number {
  return plan.reduce((sum, p) => sum + p.seconds, 0);
}
