import { useEffect, useRef, useState } from "react";
import { CINEMATIC_ASSETS as A, SCENES, FINALE, TITLES, TOTAL_VH } from "./config";
import { createDissolve } from "./dissolve";
import { createFx } from "./canvasFx";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);
const local = (p: number, i: number) => seg(p, SCENES[i]![0], SCENES[i]![1]);
const windowed = (p: number, a: number, b: number, f = 0.018) => Math.min(seg(p, a, a + f), 1 - seg(p, b - f, b));

const SCREENS = Array.from({ length: 14 }, (_, i) => ({
  left: i < 7 ? 4 + i * 5.5 : 58 + (i - 7) * 5.5,
  top: 30 + ((i * 37) % 30),
  w: 3 + ((i * 13) % 4),
  h: 8 + ((i * 7) % 10),
}));

export function Cinematic({ onSkip }: { onSkip: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const r = useRef<Record<string, HTMLElement | null>>({});
  const set = (k: string) => (el: HTMLElement | null) => { r.current[k] = el; };
  const titleRefs = useRef<(HTMLElement | null)[]>([]);
  const screenRefs = useRef<(HTMLElement | null)[]>([]);
  const darboCanvas = useRef<HTMLCanvasElement>(null);
  const fxCanvas = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [sound, setSound] = useState(false);
  const soundRef = useRef<{ ctx: AudioContext; filter: BiquadFilterNode; gain: GainNode } | null>(null);
  const progress = useRef({ p: 0 });

  useEffect(() => {
    let raf = 0;
    let cleanup = () => {};
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = A.darboHuman;
    const lowPower = window.matchMedia("(max-width: 768px)").matches || (navigator.hardwareConcurrency || 8) < 5;
    const dissolve = darboCanvas.current ? createDissolve(darboCanvas.current, A.darboHuman, A.darboRobot) : null;
    const fx = createFx(fxCanvas.current!, lowPower);

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ lerp: 0.09 });
      (window as unknown as { __lenis?: unknown }).__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      const tween = gsap.to(progress.current, {
        p: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1 },
      });
      cleanup = () => { tween.scrollTrigger?.kill(); tween.kill(); gsap.ticker.remove(tick); lenis.destroy(); };
    })();

    const start = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = (performance.now() - start) / 1000;
      const p = progress.current.p;
      const s1 = local(p, 0), s2 = local(p, 1), s3 = local(p, 2), s4 = local(p, 3);
      const f = seg(p, FINALE[0], FINALE[1]);
      const R = r.current;
      const st = (k: string, css: Partial<CSSStyleDeclaration>) => { const el = R[k]; if (el) Object.assign(el.style, css); };

      // ---------- Darbo ----------
      const walk = ease(seg(s1, 0.04, 0.4));
      let scale = 0.38 + 0.62 * walk, tx = 0, ty = (1 - walk) * -4 + Math.sin(walk * Math.PI * 7) * 0.8 * (1 - walk), blur = 9 * (1 - walk), rotY = 0;
      let opacity = seg(s1, 0.02, 0.12);
      let bright = 0.2 + 0.8 * seg(s1, 0.04, 0.35);
      let parts: [number, number, number, number] = [
        ease(seg(s1, 0.4, 0.54)), ease(seg(s1, 0.52, 0.66)), ease(seg(s1, 0.64, 0.79)), ease(seg(s1, 0.77, 0.94)),
      ];
      let embers = seg(s1, 0.38, 0.45) * (1 - seg(s1, 0.94, 1));
      if (p >= SCENES[1][0]) {
        const m = ease(seg(s2, 0, 0.35));
        tx = 16 * m; scale = 1 + 0.1 * m; ty = 4 * m - 3 * ease(seg(s2, 0.3, 0.5));
        bright = 1;
        parts = [1, 1, 1, 1];
        embers = 0;
      }
      if (p >= SCENES[2][0]) {
        const out = ease(seg(s3, 0, 0.18));
        opacity = 1 - out; scale = 1.1 - 0.4 * out; ty = 1 + out * 10; blur = out * 8;
      }
      if (p >= SCENES[3][0]) {
        const inn = ease(seg(s4, 0.04, 0.18));
        const orbit = (s4 - 0.45) * 2;
        opacity = inn; scale = 0.92 + 0.08 * ease(seg(s4, 0.7, 1)); tx = -orbit * 8 * (1 - seg(s4, 0.72, 0.85)); ty = 2; blur = (1 - inn) * 6;
        rotY = -orbit * 16 * (1 - seg(s4, 0.72, 0.85));
        parts = [1 - ease(seg(s4, 0.54, 0.7)), 1 - ease(seg(s4, 0.45, 0.6)), 1 - ease(seg(s4, 0.35, 0.5)), 1 - ease(seg(s4, 0.24, 0.4))];
        embers = seg(s4, 0.22, 0.28) * (1 - seg(s4, 0.68, 0.72));
        bright = 1;
      }
      opacity *= 1 - seg(f, 0, 0.1);
      st("darbo", {
        opacity: String(opacity),
        transform: `translate(${tx}vw, ${ty}vh) perspective(1200px) rotateY(${rotY}deg) scale(${scale})`,
        filter: `blur(${blur.toFixed(2)}px)`,
      });
      dissolve?.render({ p: parts, eye: parts[3], bright, rim: 0.4 + 0.6 * seg(s1, 0.2, 0.4) }, t);

      // ---------- Light & atmosphere ----------
      const flickerGate = seg(p, 0.003, 0.03) * (1 - seg(s1, 0.35, 0.5));
      const flick = 0.55 + 0.45 * Math.round((Math.sin(t * Math.PI * 2 * 1.3) + 1) / 2); // ~1.3 flashes/s
      st("flicker", { opacity: String(flickerGate * flick) });
      st("mist", { opacity: String(seg(s1, 0.05, 0.3) * (1 - seg(s2, 0, 0.3)) + seg(s4, 0.1, 0.4) * 0.5 * (1 - seg(f, 0, 0.1))), transform: `translateX(${-p * 30}vw)` });
      st("rim", { opacity: String(seg(s1, 0.2, 0.45) * (1 - seg(s3, 0, 0.2))) });

      // ---------- Scene 2: command center ----------
      const ccIn = seg(p, SCENES[1][0] - 0.02, SCENES[1][0] + 0.02);
      const ccOut = ease(seg(s3, 0, 0.35));
      st("cc", {
        opacity: String(ccIn * (1 - ccOut)),
        transform: `scale(${1.05 + 0.18 * s2 - 0.55 * ccOut})`,
        filter: `blur(${ccOut * 10}px) brightness(${0.55 + 0.45 * seg(s2, 0.3, 0.8)})`,
      });
      st("ccFore", { opacity: String(ccIn * (1 - ccOut)), transform: `translateY(${ccOut * 30}vh) scale(${1.1 + 0.3 * s2})` });
      screenRefs.current.forEach((el, i) => {
        if (!el) return;
        const on = seg(s2, 0.42 + (i % 7) * 0.04, 0.46 + (i % 7) * 0.04);
        el.style.opacity = String(0.08 + on * 0.92);
      });
      st("burst", { opacity: String(windowed(s2, 0.32, 0.7, 0.08)), transform: `translate(${tx}vw, ${ty}vh) scale(${0.6 + seg(s2, 0.32, 0.6) * 1.2})` });

      // ---------- Scene 4: city ----------
      const cityIn = seg(p, SCENES[3][0] - 0.01, SCENES[3][0] + 0.03);
      const orbit = (s4 - 0.45) * 2;
      st("city", {
        opacity: String(cityIn * (1 - seg(f, 0, 0.12))),
        transform: `perspective(1400px) rotateY(${orbit * 9}deg) translateX(${orbit * -4}vw) scale(${1.18 - 0.08 * s4})`,
      });
      st("platform", { opacity: String(cityIn * (1 - seg(f, 0, 0.12))), transform: `translateX(${orbit * -12}vw)` });
      st("warm", { opacity: String(seg(s4, 0.72, 0.9) * (1 - seg(f, 0, 0.12))) });

      // ---------- Canvas fx ----------
      fx.size();
      fx.clear();
      const [W, H] = fx.dims();
      fx.embers(embers, W * (0.5 + tx / 100) - 40, H * 0.45, Math.min(W, H) * 0.18);
      fx.streams(seg(s2, 0, 0.2) * (1 - seg(s3, 0, 0.3)), t, seg(s2, 0.5, 1));
      const space = seg(s3, 0.1, 0.3) * (1 - seg(s4, 0, 0.08));
      fx.starfield(space, s3);
      fx.globe(seg(s3, 0.18, 0.38) * (1 - seg(s4, 0, 0.06)), t * 0.05 + s3 * 2.4, ease(seg(s3, 0.4, 0.92)), 0.6 + 0.5 * ease(seg(s3, 0.15, 0.5)));
      fx.vehicles(cityIn * (1 - seg(f, 0, 0.1)), t + s4 * 8);

      // ---------- Thread, titles, finale, HUD ----------
      st("thread", { strokeDashoffset: String(1 - p), opacity: String(Math.max(flickerGate * flick, seg(p, 0.02, 0.06)) * (1 - seg(f, 0.2, 0.4))) } as Partial<CSSStyleDeclaration>);
      TITLES.forEach((ti, i) => {
        const el = titleRefs.current[i];
        if (!el) return;
        const o = windowed(p, ti.at[0], ti.at[1]);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 24}px)`;
        el.style.letterSpacing = `${(1 - o) * 0.12 - 0.02}em`;
      });
      st("black", { opacity: String(seg(f, 0, 0.12)) });
      st("logoLead", { opacity: String(seg(f, 0.12, 0.35)), transform: `translateY(${(1 - seg(f, 0.12, 0.35)) * 20}px)` });
      st("logoLoco", { opacity: String(seg(f, 0.3, 0.5)), filter: `brightness(${0.4 + seg(f, 0.3, 0.55) * 1.1})` });
      st("tagline", { opacity: String(seg(f, 0.5, 0.7)) });
      st("bar", { transform: `scaleX(${p})` });

      if (soundRef.current) {
        soundRef.current.filter.frequency.value = 180 + p * 1800;
      }
    };
    loop();
    return () => { cancelAnimationFrame(raf); cleanup(); };
  }, []);

  const toggleSound = () => {
    if (sound && soundRef.current) {
      soundRef.current.ctx.close();
      soundRef.current = null;
      setSound(false);
      return;
    }
    const ctx = new AudioContext();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    [55, 82.4, 110.5].forEach((fq) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = fq;
      o.connect(filter);
      o.start();
    });
    filter.connect(gain).connect(ctx.destination);
    soundRef.current = { ctx, filter, gain };
    setSound(true);
  };

  return (
    <section ref={root} aria-label="LeadZLoco intro" className="relative bg-stage" style={{ height: `${TOTAL_VH}vh` }}>
      {TITLES.map((ti) => (
        <h2 key={ti.text} className="sr-only">{ti.text}</h2>
      ))}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Scene 2 plates */}
        <img ref={set("cc")} src={A.commandCenter} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0" />
        <div ref={set("ccFore")} className="cine-console absolute inset-x-0 bottom-0 h-[38vh] opacity-0" />
        <div className="absolute inset-0">
          {SCREENS.map((s, i) => (
            <div
              key={i}
              ref={(el) => { screenRefs.current[i] = el; }}
              className="cine-screen absolute opacity-0"
              style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.w}%`, height: `${s.h}%` }}
            />
          ))}
        </div>
        {/* Scene 4 plates */}
        <img ref={set("city")} src={A.futureCity} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0" />
        <div ref={set("platform")} className="cine-platform absolute -inset-x-[20vw] bottom-0 h-[30vh] opacity-0" />
        <div ref={set("warm")} className="cine-warm absolute inset-0 opacity-0" />

        {/* Atmosphere */}
        <div ref={set("mist")} className="cine-mist absolute -inset-x-[40vw] inset-y-0 opacity-0" />
        <div ref={set("flicker")} className="cine-flicker absolute inset-0 opacity-0" />
        <div ref={set("rim")} className="cine-rim absolute inset-0 opacity-0" />

        <canvas ref={fxCanvas} className="pointer-events-none absolute inset-0 h-full w-full" />
        <div ref={set("burst")} className="cine-burst pointer-events-none absolute left-[38%] top-[44%] h-40 w-40 opacity-0" />

        {/* Darbo */}
        <div
          ref={set("darbo")}
          className="absolute bottom-0 left-1/2 -ml-[min(34.5vh,46vw)] aspect-[3/4] h-[92vh] max-w-[92vw] origin-bottom opacity-0"
        >
          <canvas ref={darboCanvas} className="h-full w-full" />
        </div>

        {/* Thread */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <path
            ref={set("thread") as never}
            d="M -5 78 C 20 70, 30 30, 50 40 S 80 70, 105 18"
            pathLength={1}
            className="cine-thread"
            style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 }}
          />
        </svg>

        {/* Titles */}
        {TITLES.map((ti, i) => (
          <p
            key={ti.text}
            aria-hidden
            ref={(el) => { titleRefs.current[i] = el; }}
            className={`title-card absolute opacity-0 ${ti.small ? "title-card--small" : ""} ${ti.align === "left" ? "left-[6vw] top-[16vh] text-left" : "right-[6vw] bottom-[16vh] text-right"}`}
          >
            {ti.text}
          </p>
        ))}

        <div className="grain pointer-events-none absolute inset-0" />
        <div className="vignette pointer-events-none absolute inset-0" />

        {/* Finale */}
        <div ref={set("black")} className="absolute inset-0 flex flex-col items-center justify-center bg-stage opacity-0">
          <p className="logo-mark">
            <span ref={set("logoLead")} className="logo-lead inline-block">LeadZ</span>
            <span ref={set("logoLoco")} className="logo-loco inline-block">Loco</span>
            <sup className="logo-tm">™</sup>
          </p>
          <p ref={set("tagline")} className="eyebrow mt-6 opacity-0">Building businesses that scale without limits.</p>
        </div>

        {/* HUD */}
        <div className="absolute inset-x-[6vw] bottom-8 z-10 flex items-end gap-6">
          <div className="relative h-px flex-1 bg-hud-track">
            <div ref={set("bar")} className="absolute inset-0 origin-left bg-gold" style={{ transform: "scaleX(0)" }} />
            {SCENES.map(([s], i) => (
              <span key={i} className="eyebrow absolute -top-6 -translate-x-1/2" style={{ left: `${s * 100}%`, marginLeft: i === 0 ? 10 : 0 }}>
                0{i + 1}
              </span>
            ))}
          </div>
          <button onClick={toggleSound} className="hud-btn" aria-pressed={sound}>
            Sound {sound ? "on" : "off"}
          </button>
          <button onClick={onSkip} className="hud-btn">Skip intro</button>
        </div>
        <p className="eyebrow absolute left-[6vw] top-8 z-10">Scroll to begin</p>

        {/* Loader */}
        <div className={`cine-loader absolute inset-0 z-20 transition-opacity duration-700 ${loaded ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <div className="cine-loader-light" />
        </div>
      </div>
    </section>
  );
}

export function StaticIntro({ onSkip }: { onSkip: () => void }) {
  return (
    <section aria-label="LeadZLoco intro" className="relative bg-stage">
      {[
        { img: A.darboHuman, t: "The Evolution Begins" },
        { img: A.darboRobot, t: "Intelligence Has Evolved" },
        { img: A.futureCity, t: "Without Limits" },
        { img: A.darboHuman, t: "Technology evolves. Vision remains human." },
      ].map((s) => (
        <div key={s.t} className="relative flex min-h-[80vh] items-end overflow-hidden px-[6vw] py-16">
          <img src={s.img} alt="" className="absolute inset-0 h-full w-full object-contain opacity-70" loading="lazy" />
          <h2 className="title-card relative">{s.t}</h2>
        </div>
      ))}
      <div className="flex justify-end px-[6vw] pb-10">
        <button className="hud-btn" onClick={onSkip}>Skip intro</button>
      </div>
    </section>
  );
}
