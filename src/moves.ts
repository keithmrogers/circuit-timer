// The moves in the circuit, with the same stick-figure drawings as the printable poster.
// Each drawing is the inner SVG of a 160x92 viewBox, stroked in the current color.

export interface Move {
  id: string;
  name: string;
  cue: string;
  /** SVG markup inside <svg viewBox="0 0 160 92">. */
  art: string;
}

const floor = (x1: number, x2: number) =>
  `<line class="floor" x1="${x1}" y1="88" x2="${x2}" y2="88"/>`;

export const WARM_UP: Move = {
  id: "warm-up",
  name: "Warm up",
  cue: "Jumping jacks, high knees and arm circles.",
  art: `${floor(30, 130)}<circle cx="80" cy="16" r="8"/><path d="M80 24 L80 54 M80 54 L62 86 M80 54 L98 86 M80 30 L60 8 M80 30 L100 8"/>`,
};

export const COOL_DOWN: Move = {
  id: "cool-down",
  name: "Cool down",
  cue: "Sit, reach for your toes and breathe slowly.",
  art: `${floor(20, 144)}<circle cx="90" cy="50" r="8"/><path d="M58 84 L132 84 M58 84 L82 58 M80 62 L120 76"/>`,
};

export const REST: Move = {
  id: "rest",
  name: "Rest",
  cue: "Shake it out and get some water.",
  art: `${floor(30, 130)}<circle cx="80" cy="16" r="8"/><path d="M80 24 L80 56 M80 56 L70 86 M80 56 L90 86 M80 32 L68 52 M80 32 L92 52"/>`,
};

export const MOVES: Move[] = [
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
    cue: "Stand on one foot. Switch feet halfway.",
    art: `${floor(30, 130)}<circle cx="80" cy="14" r="8"/><path d="M80 22 L80 54 L80 86 M80 54 L96 64 L88 78 M80 30 L56 28 M80 30 L104 28"/>`,
  },
];
