// Canvas 2D effects: particles, data streams, star field and a dotted network globe.
const BLUE = "92,170,255";
const GOLD = "232,186,96";

type P = { x: number; y: number; vx: number; vy: number; life: number; s: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// Rough continent blobs (lat, lon, radius deg) for the dotted globe.
const LAND: [number, number, number][] = [
  [48, -100, 22], [60, -110, 18], [35, -90, 14], [20, -100, 9], [-10, -60, 16], [-30, -65, 12],
  [50, 15, 14], [55, 40, 18], [60, 90, 25], [35, 105, 18], [25, 78, 12], [10, 20, 18], [-10, 25, 16],
  [-25, 135, 14], [70, -40, 9], [15, 45, 9], [5, 110, 8],
];
const CITIES: [number, number][] = [
  [40.7, -74], [51.5, 0], [35.7, 139.7], [-33.9, 151.2], [1.3, 103.8], [25.2, 55.3], [-23.5, -46.6],
  [19.4, -99.1], [37.8, -122.4], [52.5, 13.4], [28.6, 77.2], [-1.3, 36.8], [55.8, 37.6], [6.5, 3.4],
  [31.2, 121.5], [43.7, -79.4],
];

export function createFx(canvas: HTMLCanvasElement, lowPower: boolean) {
  const ctx = canvas.getContext("2d")!;
  const N = lowPower ? 260 : 900;
  const parts: P[] = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), vx: 0, vy: 0, life: Math.random(), s: Math.random() }));
  const stars = Array.from({ length: lowPower ? 250 : 700 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() }));
  const globePts: [number, number, number][] = [];
  const GN = lowPower ? 2200 : 5000;
  for (let i = 0; i < GN; i++) {
    const y = 1 - (i / (GN - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
    const lat = (Math.asin(y) * 180) / Math.PI, lon = ((th * 180) / Math.PI) % 360 - 180;
    const land = LAND.some(([a, b, rad]) => {
      const dl = ((lon - b + 540) % 360) - 180;
      return (lat - a) ** 2 + (dl * Math.cos((lat * Math.PI) / 180)) ** 2 < rad * rad;
    });
    if (land) globePts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
  }
  const ll = (lat: number, lon: number): [number, number, number] => {
    const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
    return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
  };
  const arcs = CITIES.flatMap((a, i) => [CITIES[(i * 5 + 3) % CITIES.length]!, CITIES[(i + 7) % CITIES.length]!].map((b) => [ll(...a), ll(...b)] as const));

  let W = 0, H = 0;
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w !== W || h !== H) { W = w; H = h; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  }

  function embers(amount: number, cx: number, cy: number, spread: number) {
    if (amount <= 0) return;
    ctx.globalCompositeOperation = "lighter";
    const count = Math.floor(N * 0.5 * amount);
    for (let i = 0; i < count; i++) {
      const p = parts[i]!;
      p.life += 0.004 + p.s * 0.006;
      if (p.life > 1) { p.life = 0; p.x = rand(-1, 1); p.y = rand(-1, 1); }
      const x = cx + p.x * spread + Math.sin(p.life * 6 + i) * 20 + p.life * 60;
      const y = cy + p.y * spread * 1.3 - p.life * 160;
      const a = Math.sin(p.life * Math.PI) * 0.8;
      ctx.fillStyle = `rgba(${BLUE},${a})`;
      const s = 1 + p.s * 2;
      ctx.fillRect(x, y, s, s);
    }
  }

  function streams(amount: number, t: number, bright: number) {
    if (amount <= 0) return;
    ctx.globalCompositeOperation = "lighter";
    const count = Math.floor(N * amount);
    for (let i = 0; i < count; i++) {
      const p = parts[i]!;
      const lane = (i % 40) / 40;
      const speed = 0.04 + p.s * 0.08;
      const x = ((p.x + t * speed) % 1.2) - 0.1;
      const y = lane + Math.sin(x * 6 + lane * 12 + t * 0.4) * 0.06;
      const len = 20 + p.s * 60;
      const a = (0.15 + bright * 0.6) * amount * (0.4 + p.s * 0.6);
      ctx.strokeStyle = i % 17 === 0 ? `rgba(${GOLD},${a})` : `rgba(${BLUE},${a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x * W, y * H);
      ctx.lineTo(x * W - len, y * H - Math.cos(x * 6) * 4);
      ctx.stroke();
    }
  }

  function starfield(amount: number, push: number) {
    if (amount <= 0) return;
    ctx.globalCompositeOperation = "lighter";
    for (const s of stars) {
      const z = 0.3 + s.z * 0.7;
      const x = W / 2 + (s.x - 0.5) * W * (1.4 - push * 0.4 * z);
      const y = H / 2 + (s.y - 0.5) * H * (1.4 - push * 0.4 * z);
      ctx.fillStyle = `rgba(220,235,255,${amount * z * 0.8})`;
      ctx.fillRect(x, y, z * 1.6, z * 1.6);
    }
  }

  function globe(amount: number, rot: number, connect: number, scale: number) {
    if (amount <= 0) return;
    const R = Math.min(W, H) * 0.34 * scale;
    const cx = W * 0.58, cy = H * 0.54;
    ctx.globalCompositeOperation = "source-over";
    const atm = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35);
    atm.addColorStop(0, `rgba(${BLUE},${0.35 * amount})`);
    atm.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = atm;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2); ctx.fill();
    const body = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.1, cx, cy, R);
    body.addColorStop(0, `rgba(14,28,52,${amount})`);
    body.addColorStop(1, `rgba(2,5,12,${amount})`);
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    const tilt = 0.35, c = Math.cos(rot), s = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
    const proj = (v: readonly [number, number, number]) => {
      const x = v[0] * c - v[2] * s, z0 = v[0] * s + v[2] * c;
      const y = v[1] * ct - z0 * st, z = v[1] * st + z0 * ct;
      return [cx + x * R, cy - y * R, z] as const;
    };
    ctx.globalCompositeOperation = "lighter";
    const glow = connect;
    for (const g of globePts) {
      const [x, y, z] = proj(g);
      if (z < 0) continue;
      const a = amount * (0.25 + z * 0.55 + glow * 0.3);
      ctx.fillStyle = Math.random() < 0.02 * glow ? `rgba(${GOLD},${a})` : `rgba(${BLUE},${a})`;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    const shown = Math.floor(arcs.length * connect);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < shown + 1 && i < arcs.length; i++) {
      const frac = i < shown ? 1 : (arcs.length * connect) % 1;
      const [a, b] = arcs[i]!;
      ctx.beginPath();
      let started = false;
      const steps = 40;
      for (let k = 0; k <= steps * frac; k++) {
        const t = k / steps;
        const v: [number, number, number] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        const len = Math.hypot(...v), lift = 1 + Math.sin(t * Math.PI) * 0.22;
        const [x, y, z] = proj([(v[0] / len) * lift, (v[1] / len) * lift, (v[2] / len) * lift]);
        if (z < -0.1) { started = false; continue; }
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${i % 4 === 0 ? GOLD : BLUE},${0.8 * amount})`;
      ctx.stroke();
    }
  }

  function vehicles(amount: number, t: number) {
    if (amount <= 0) return;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 26; i++) {
      const lane = 0.18 + (i % 9) * 0.05;
      const dir = i % 2 ? 1 : -1;
      const x = (((i * 0.137 + t * (0.02 + (i % 5) * 0.01) * dir) % 1) + 1) % 1;
      ctx.fillStyle = `rgba(${i % 3 ? GOLD : BLUE},${0.8 * amount})`;
      ctx.fillRect(x * W, lane * H + Math.sin(t + i) * 4, 10 + (i % 4) * 4, 1.6);
    }
  }

  return { size, clear: () => ctx.clearRect(0, 0, W, H), embers, streams, starfield, globe, vehicles, dims: () => [W, H] as const };
}
