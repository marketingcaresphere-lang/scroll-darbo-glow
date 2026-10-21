// Single source of truth for the Who We Are page.
//
// IMAGE SLOTS — the comment on each import names the scene(s) that consume
// the plate. To replace a plate, swap the file at the same path; no scene
// code needs to change. All plates are graded toward the site palette
// (near-black / electric blue / gold; red only on Darbo's glasses).
import darboPortrait from "@/assets/who/darbo-portrait.jpg"; // IMAGE SLOT: Scene 4 — half-wireframe portrait, clean
import stageDarbo from "@/assets/who/stage-darbo-full.jpg"; // IMAGE SLOT: Scenes 1 & 3 — Darbo full length on stage (screens text-free)
import robotFloor from "@/assets/who/robot-callcenter.jpg"; // IMAGE SLOT: Scenes 2 & 3 — rows of robots at workstations (text-free)
import robotsHandoff from "@/assets/who/robots-handoff.jpg"; // IMAGE SLOT: Scene 3 — cutaway: two robots passing a glowing chip
import commandCenter from "@/assets/command-center.jpg"; // IMAGE SLOT: Scene 6 — leaders at a holographic command room (existing plate)

export const WHO_ASSETS = {
  darboPortrait,
  stageDarbo,
  robotFloor,
  robotsHandoff,
  commandCenter,
};

// Scroll budget in vh: 1 Voice, 2 Floor, 3 Connection, 4 Person, 5 How we work, 6 Invitation.
export const SCENE_VH = [180, 200, 150, 120, 120, 60] as const;
export const TOTAL_VH = SCENE_VH.reduce((a, b) => a + b, 0);

const acc = (n: number) => SCENE_VH.slice(0, n).reduce((a, b) => a + b, 0) / TOTAL_VH;
type Range = readonly [number, number];
// Normalised [start, end] of each scene in overall page progress.
export const SCENES = [0, 1, 2, 3, 4, 5].map((i) => [acc(i), acc(i + 1)] as Range) as unknown as readonly [
  Range,
  Range,
  Range,
  Range,
  Range,
  Range,
];

// Workstation coordinates on the robot-floor plate (fractions of the frame).
// Drive the headset rings, connection lines and travelling particles in Scene 2.
export const STATIONS = [
  { x: 0.1, y: 0.46 },
  { x: 0.17, y: 0.6 },
  { x: 0.25, y: 0.74 },
  { x: 0.9, y: 0.46 },
  { x: 0.83, y: 0.6 },
  { x: 0.75, y: 0.74 },
  { x: 0.33, y: 0.36 },
  { x: 0.67, y: 0.36 },
] as const;

// Glowing hub the workstation lines converge on (Scene 2).
export const CORE = { x: 0.5, y: 0.4 } as const;

// Screen-glow areas on the stage plate (fractions) that ignite during Scene 1.
export const STAGE_SCREENS = [
  { x: 0.01, y: 0.2, w: 0.29, h: 0.34 },
  { x: 0.55, y: 0.24, w: 0.19, h: 0.28 },
  { x: 0.79, y: 0.22, w: 0.2, h: 0.3 },
] as const;

// All page words live here (rendered as live HTML text — nothing is baked
// into the plates). Tone: short, direct, no buzzwords.
export const COPY = {
  s1: {
    l1: "We start",
    l2: "with people.",
    sub: "Every system we build begins with a human with a vision.",
  },
  s2: {
    l1: "And a workforce",
    l2: "that never stops.",
    stmt: "Always on. Always working.",
    counters: ["Conversations handled", "Tasks completed", "Hours worked"],
  },
  s3: {
    h: "Vision in. Results out.",
    sub: "He sets the direction. They carry it out. Together, nothing slows down.",
  },
  s4: {
    h: "Technology evolves. Vision remains human.",
    beats: [
      "Darbo built LeadZLoco on a simple belief: people come first.",
      "He makes AI make sense — tools a real team can pick up and use.",
      "Never a replacement. A way to give people more reach than they had.",
    ],
  },
  s5: {
    eyebrow: "How we work",
    stations: [
      { t: "Understand the goal", d: "We start by listening. What are you actually trying to fix?" },
      { t: "Find the right place to start", d: "No giant rollout. One clear starting point that proves itself fast." },
      { t: "Show the results", d: "Real output early, in the open — then we adjust together." },
      { t: "Bring the team along", d: "Your people learn the system as it grows, not after." },
      { t: "Scale with confidence", d: "When it works, we widen it. Carefully, with room to breathe." },
    ],
  },
  s6: {
    h: "Ready when you are.",
    cta: "Start building.",
    mail: "hello@leadzloco.com", // PLACEHOLDER contact — pending the real address
  },
} as const;
