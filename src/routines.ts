// The routines the app can run. To add one: write a Routine below and add it to ROUTINES.
// Drawings are the inner SVG of a 160x92 viewBox. Classes: floor, wall, prop (furniture),
// accent (orange marks), thick (with accent: dumbbells).

export interface Move {
  id: string;
  name: string;
  cue: string;
  /** SVG markup inside <svg viewBox="0 0 160 92">. */
  art: string;
  /** One side, then the other: the app says "Switch sides" halfway through. */
  switchHalfway?: boolean;
}

export interface Routine {
  id: string;
  name: string;
  tagline: string;
  equipment?: string;
  moves: Move[];
  warmUp: Move;
  coolDown: Move;
  rest: Move;
  warmUpSeconds: number;
  coolDownSeconds: number;
  restSeconds: number;
  /** The rest after the last move of a round (except the last round). */
  roundRestSeconds: number;
  workOptions: number[];
  defaultWork: number;
  roundsOptions: number[];
  defaultRounds: number;
  /** Main color and the soft tint behind work phases. */
  theme: { accent: string; soft: string };
}

const floor = (x1: number, x2: number) =>
  `<line class="floor" x1="${x1}" y1="88" x2="${x2}" y2="88"/>`;
const chair = (x1: number, x2: number, back = true) =>
  `<path class="prop" d="M${x1} 58 L${x2} 58 ${back ? `M${x1} 58 L${x1} 24 ` : ""}M${x1 + 2} 58 L${x1 + 2} 86 M${x2 - 2} 58 L${x2 - 2} 86"/>`;
const counterLeft = `<path class="prop" d="M16 46 L52 46 M52 46 L52 88"/>`;
const upArrow = (x: number, y1: number, y2: number) =>
  `<path class="accent" d="M${x} ${y1} L${x} ${y2} M${x - 7} ${y2 + 7} L${x} ${y2} L${x + 7} ${y2 + 7}"/>`;

const standingRest: Move = {
  id: "rest",
  name: "Rest",
  cue: "Shake it out and get some water.",
  art: `${floor(30, 130)}<circle cx="80" cy="16" r="8"/><path d="M80 24 L80 56 M80 56 L70 86 M80 56 L90 86 M80 32 L68 52 M80 32 L92 52"/>`,
};

export const KIDS: Routine = {
  id: "kids",
  name: "My Strength Circuit",
  tagline: "No equipment. Just you and some floor space.",
  warmUpSeconds: 120,
  coolDownSeconds: 60,
  restSeconds: 20,
  roundRestSeconds: 60,
  workOptions: [30, 40],
  defaultWork: 30,
  roundsOptions: [1, 2, 3],
  defaultRounds: 2,
  theme: { accent: "#0e7c7b", soft: "#eef6f6" },
  rest: standingRest,
  warmUp: {
    id: "warm-up",
    name: "Warm up",
    cue: "Jumping jacks, high knees and arm circles.",
    art: `${floor(30, 130)}<circle cx="80" cy="16" r="8"/><path d="M80 24 L80 54 M80 54 L62 86 M80 54 L98 86 M80 30 L60 8 M80 30 L100 8"/>`,
  },
  coolDown: {
    id: "cool-down",
    name: "Cool down",
    cue: "Sit, reach for your toes and breathe slowly.",
    art: `${floor(20, 144)}<circle cx="90" cy="50" r="8"/><path d="M58 84 L132 84 M58 84 L82 58 M80 62 L120 76"/>`,
  },
  moves: [
    {
      id: "squats",
      name: "Squats",
      cue: "Sit back like there's a chair behind you. Chest up!",
      art: `${floor(30, 130)}<circle cx="72" cy="20" r="8"/><path d="M71 28 L62 58 M62 58 L86 60 L84 86 L94 86 M69 38 L100 40"/>`,
    },
    {
      id: "wall-push-ups",
      name: "Wall push-ups",
      cue: "Hands on the wall, body straight like a board.",
      art: `${floor(20, 124)}<line class="wall" x1="124" y1="6" x2="124" y2="88"/><circle cx="100" cy="26" r="8"/><path d="M94 33 L46 86 M90 38 L106 52 L122 40"/>`,
    },
    {
      id: "glute-bridges",
      name: "Glute bridges",
      cue: "On your back, knees bent. Squeeze and lift your hips.",
      art: `${floor(14, 140)}<circle cx="28" cy="76" r="8"/><path d="M37 78 L82 56 L106 50 L114 86 M40 82 L72 85"/>`,
    },
    {
      id: "bear-crawl",
      name: "Bear crawl",
      cue: "Hands and feet down, knees just off the floor. 4 steps forward, 4 back.",
      art: `${floor(20, 140)}<circle cx="46" cy="44" r="8"/><path d="M56 50 L104 50 M58 51 L56 86 M104 50 L94 74 L120 86"/><path class="accent" d="M58 18 L104 18 M96 11 L104 18 L96 25 M66 11 L58 18 L66 25"/>`,
    },
    {
      id: "plank",
      name: "Plank",
      cue: "Body straight from head to heels. Hold it!",
      art: `${floor(14, 146)}<circle cx="30" cy="54" r="8"/><path d="M40 60 L132 80 L134 86 M44 62 L44 86 L64 86"/>`,
    },
    {
      id: "lunges",
      name: "Step-back lunges",
      cue: "Step one foot back and bend both knees. Switch legs.",
      art: `${floor(30, 130)}<circle cx="80" cy="14" r="8"/><path d="M80 22 L80 54 M80 54 L100 64 L100 86 M80 54 L66 80 L48 84 M80 30 L92 48"/>`,
    },
    {
      id: "flamingo",
      name: "Flamingo balance",
      cue: "Stand on one foot.",
      art: `${floor(30, 130)}<circle cx="80" cy="14" r="8"/><path d="M80 22 L80 54 L80 86 M80 54 L96 64 L88 78 M80 30 L56 28 M80 30 L104 28"/>`,
      switchHalfway: true,
    },
  ],
};

export const CHAIR_COUNTER: Routine = {
  id: "chair-counter",
  name: "Chair & Counter Strength",
  tagline: "No floor work. Plenty of rest. Sit down whenever you need to.",
  equipment: "A sturdy chair (no wheels), a counter, a resistance band, light dumbbells.",
  warmUpSeconds: 180,
  coolDownSeconds: 180,
  restSeconds: 30,
  roundRestSeconds: 120,
  workOptions: [30, 40],
  defaultWork: 30,
  roundsOptions: [1, 2, 3],
  defaultRounds: 2,
  theme: { accent: "#5a3478", soft: "#f5f0fa" },
  rest: {
    id: "rest",
    name: "Rest",
    cue: "Sit down, breathe, sip some water.",
    art: `${floor(20, 140)}${chair(50, 100)}<circle cx="66" cy="16" r="8"/><path d="M66 24 L66 56 L94 56 L94 86 M66 32 L80 50"/>`,
  },
  warmUp: {
    id: "warm-up",
    name: "Warm up",
    cue: "March in place (or seated), shoulder rolls, arm circles, a few easy sit-to-stands.",
    art: `${floor(30, 130)}<circle cx="80" cy="14" r="8"/><path d="M80 22 L80 54 L80 86 M80 54 L96 62 L94 80 M80 30 L66 46 M80 30 L96 22"/>`,
  },
  coolDown: {
    id: "cool-down",
    name: "Cool down",
    cue: "Easy seated stretches: reach up, then each leg out straight. Breathe slowly.",
    art: `${floor(20, 140)}${chair(40, 90)}<circle cx="56" cy="16" r="8"/><path d="M56 24 L56 56 L84 56 L122 80 M56 30 L50 4 M56 30 L64 4"/>`,
  },
  moves: [
    {
      id: "sit-to-stand",
      name: "Sit-to-stand",
      cue: "Stand up, then sit back down slowly. Use your hands if you need to.",
      art: `${floor(20, 140)}<path class="prop" d="M40 56 L76 56 M40 56 L40 20 M42 56 L42 86 M74 56 L74 86"/><circle cx="92" cy="22" r="8"/><path d="M88 30 L76 52 L100 62 L100 86 M86 36 L100 44"/>${upArrow(124, 52, 22)}`,
    },
    {
      id: "counter-push-ups",
      name: "Counter push-ups",
      cue: "Hands on the counter. Lower your chest toward it, push away.",
      art: `${floor(14, 150)}<path class="prop" d="M106 48 L150 48 M108 48 L108 88"/><circle cx="100" cy="30" r="8"/><path d="M93 37 L36 86 M90 40 L108 48"/>`,
    },
    {
      id: "shoulder-press",
      name: "Seated shoulder press",
      cue: "Back against the chair. Press the dumbbells up, lower slowly.",
      art: `${floor(20, 140)}${chair(58, 100, false)}<circle cx="72" cy="26" r="8"/><path d="M72 34 L72 56 L100 56 L100 86 M72 40 L54 38 L54 16 M72 40 L90 38 L90 16"/><path class="accent thick" d="M47 14 L61 14 M83 14 L97 14"/>`,
    },
    {
      id: "side-leg-raises",
      name: "Side leg raises",
      cue: "Hold the counter. Lift one leg out to the side, slow and small.",
      art: `${floor(14, 146)}${counterLeft}<circle cx="82" cy="14" r="8"/><path d="M82 22 L82 54 L80 86 M82 54 L112 74 M82 30 L56 46 M82 30 L98 46"/>`,
      switchHalfway: true,
    },
    {
      id: "band-pull-aparts",
      name: "Band pull-aparts",
      cue: "Arms out, band in both hands. Pull apart, squeeze your shoulder blades.",
      art: `${floor(30, 130)}<circle cx="80" cy="14" r="8"/><path d="M80 22 L80 56 M80 56 L68 86 M80 56 L92 86 M80 32 L44 34 M80 32 L116 34"/><path class="accent" d="M44 40 Q80 46 116 40"/>`,
    },
    {
      id: "counter-kickbacks",
      name: "Counter kickbacks",
      cue: "Hold the counter. Squeeze your glute and push one leg straight back.",
      art: `${floor(14, 150)}<path class="prop" d="M108 40 L150 40 M108 40 L108 88"/><circle cx="96" cy="20" r="8"/><path d="M92 28 L80 56 L82 86 M80 56 L52 72 M90 34 L108 40"/>`,
      switchHalfway: true,
    },
    {
      id: "seated-march",
      name: "Seated march",
      cue: "Sit tall, hold the seat. Lift one knee, then the other. Belly tight.",
      art: `${floor(20, 140)}${chair(50, 100)}<circle cx="66" cy="16" r="8"/><path d="M66 24 L66 56 L94 56 L94 86 M66 56 L90 40 L94 64 M66 32 L60 52"/>`,
    },
    {
      id: "calf-raises",
      name: "Calf raises",
      cue: "Hold the counter. Rise up onto your toes, pause, lower slowly.",
      art: `${floor(14, 146)}${counterLeft}<circle cx="84" cy="12" r="8"/><path d="M84 20 L84 52 M84 52 L80 80 L78 86 M84 52 L88 80 L90 86 M84 28 L54 46"/>${upArrow(118, 74, 44)}`,
    },
  ],
};

export const ROUTINES: Routine[] = [KIDS, CHAIR_COUNTER];

export function findRoutine(id: string | null | undefined): Routine | undefined {
  return ROUTINES.find((r) => r.id === id);
}
