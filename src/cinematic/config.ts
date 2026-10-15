// Single source of truth for cinematic assets. Swap files here without touching scene code.
import darboHuman from "@/assets/darbo-human-matched.png";
import darboRobot from "@/assets/darbo-full-cyborg.png";
import commandCenter from "@/assets/command-center.jpg";
import futureCity from "@/assets/future-city.jpg";

export const CINEMATIC_ASSETS = {
  darboHuman,
  darboRobot,
  // Body-part masks are generated procedurally in the dissolve shader until
  // real grayscale mask maps (mask-hand/arm/chest/face) are supplied.
  masks: null as null | { hand: string; arm: string; chest: string; face: string },
  commandCenter,
  futureCity,
};

// Scroll budget in vh: four scenes + finale.
export const SCENE_VH = [200, 200, 175, 225] as const;
export const FINALE_VH = 100;
export const TOTAL_VH = SCENE_VH.reduce((a, b) => a + b, 0) + FINALE_VH;

const acc = (n: number) => SCENE_VH.slice(0, n).reduce((a, b) => a + b, 0) / TOTAL_VH;
// Normalised [start, end] of each scene in overall progress.
type Range = readonly [number, number];
export const SCENES = [0, 1, 2, 3].map((i) => [acc(i), acc(i + 1)] as const) as unknown as readonly [Range, Range, Range, Range];
export const FINALE: readonly [number, number] = [acc(4), 1];

export const PALETTE = {
  blue: [92, 170, 255] as const,
  gold: [232, 186, 96] as const,
};

export const TITLES: { text: string; small?: boolean; at: [number, number]; align: "left" | "right" }[] = [
  { text: "The Evolution Begins", at: [0.13, 0.21], align: "left" },
  { text: "Intelligence Has Evolved", at: [0.25, 0.33], align: "left" },
  { text: "The Future Doesn't Wait", at: [0.34, 0.43], align: "right" },
  { text: "Without Limits", at: [0.48, 0.56], align: "left" },
  { text: "One vision. Unlimited reach.", small: true, at: [0.56, 0.63], align: "right" },
  { text: "The Next Evolution Is Here", at: [0.66, 0.74], align: "left" },
  { text: "Technology evolves. Vision remains human.", small: true, at: [0.81, 0.88], align: "right" },
];
