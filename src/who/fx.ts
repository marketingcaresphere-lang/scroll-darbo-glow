// Canvas overlays for the Who We Are page: particles travelling along the
// Scene 2 workstation lines, plus ambient light dust. Only transform-free
// 2D canvas work — driven from the same rAF loop as the DOM scenes.
export function createWhoFx(canvas: HTMLCanvasElement, lowPower: boolean) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const size = () => {
    if (!ctx) return;
    const r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const clear = () => {
    if (ctx) ctx.clearRect(0, 0, w, h);
  };

  // Ambient dust motes (seeded, deterministic).
  const motes = Array.from({ length: 26 }, (_, i) => ({
    x: ((i * 137) % 100) / 100,
    y: ((i * 61) % 100) / 100,
    s: 0.6 + ((i * 29) % 10) / 12,
    ph: (i * 53) % 100,
  }));

  const dot = (x: number, y: number, r: number, color: string, a: number) => {
    if (!ctx) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  // Particles running from each workstation toward the core (Scene 2).
  // stations/core in fractions; k = intensity 0..1.
  const streams = (
    k: number,
    t: number,
    stations: readonly { x: number; y: number }[],
    core: { x: number; y: number },
  ) => {
    if (!ctx || k <= 0.01 || lowPower) return;
    stations.forEach((s, i) => {
      for (let j = 0; j < 2; j++) {
        const u = (t * 0.16 + i * 0.19 + j * 0.47 + 0.13) % 1;
        const x = (s.x + (core.x - s.x) * u) * w;
        const y = (s.y + (core.y - s.y) * u) * h;
        const fade = Math.sin(u * Math.PI);
        dot(x, y, j ? 1.6 : 1.1, j ? "rgba(245,184,0,1)" : "rgba(120,185,255,1)", k * fade * (j ? 0.5 : 0.8));
      }
    });
  };

  // Soft drifting motes, used on the stage and portrait scenes.
  const dust = (k: number, t: number) => {
    if (!ctx || k <= 0.01 || lowPower) return;
    motes.forEach((m, i) => {
      const y = ((m.y - t * 0.012 * m.s) % 1 + 1) % 1;
      const x = (m.x + Math.sin(t * 0.3 + m.ph) * 0.015 + 1) % 1;
      const a = k * (0.25 + 0.25 * Math.sin(t * 1.4 + i));
      dot(x * w, y * h, m.s, "rgba(150,200,255,1)", a * 0.5);
    });
  };

  return { size, clear, streams, dust };
}
