import type { Move, Routine } from "./routines";

export type PhaseKind = "ready" | "warm-up" | "work" | "rest" | "cool-down";

export interface Phase {
  kind: PhaseKind;
  move: Move;
  seconds: number;
  /** 1-based round, for work and rest phases. */
  round?: number;
}

export interface Choices {
  rounds: number;
  workSeconds: number;
}

/** Get ready, warm up, each move with a rest after it (a longer one between rounds), cool down. */
export function buildPlan(routine: Routine, c: Choices): Phase[] {
  const ready: Move = { ...routine.rest, id: "ready", name: "Get ready", cue: "Find your spot." };
  const plan: Phase[] = [
    { kind: "ready", move: ready, seconds: 5 },
    { kind: "warm-up", move: routine.warmUp, seconds: routine.warmUpSeconds },
  ];
  const moves = routine.moves;
  for (let round = 1; round <= c.rounds; round++) {
    moves.forEach((move, i) => {
      plan.push({ kind: "work", move, seconds: c.workSeconds, round });
      const lastMove = i === moves.length - 1;
      if (lastMove && round === c.rounds) return; // straight into the cool down
      plan.push({
        kind: "rest",
        move: routine.rest,
        seconds: lastMove ? routine.roundRestSeconds : routine.restSeconds,
        round,
      });
    });
  }
  plan.push({ kind: "cool-down", move: routine.coolDown, seconds: routine.coolDownSeconds });
  return plan;
}

export function totalSeconds(plan: Phase[]): number {
  return plan.reduce((sum, p) => sum + p.seconds, 0);
}
