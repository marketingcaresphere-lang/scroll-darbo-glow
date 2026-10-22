import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { WHO_ASSETS as A, SCENES, TOTAL_VH, STATIONS, CORE, STAGE_SCREENS, COPY } from "./config";
import { createWhoFx } from "./fx";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);
const local = (p: number, i: number) => seg(p, SCENES[i]![0], SCENES[i]![1]);
const fmt = (n: number) => n.toLocaleString("en-US");
const logo = (
  <Link to="/" className="font-display text-xl font-black tracking-tight" style={{ fontStretch: "125%" }}>
    <span className="logo-lead">LeadZ</span>
    <span className="logo-loco">Loco</span>
    <sup className="logo-tm">™</sup>
  </Link>
);

export function WhoPage() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return (
    <main className="bg-stage text-foreground">
      <a
        href="#who-end"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip this page
      </a>
      {reduced ? <WhoStatic /> : <WhoScenes />}
      <div id="who-end" aria-hidden />
    </main>
  );
}

function WhoHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[6vw] py-6">
      {logo}
      <Link to="/" className="eyebrow hover:text-foreground">
        Home
      </Link>
    </header>
  );
}

function WhoScenes() {
  const root = useRef<HTMLElement>(null);
  const r = useRef<Record<string, HTMLElement | null>>({});
  const set = (k: string) => (el: HTMLElement | null) => {
    r.current[k] = el;
  };
  const screenRefs = useRef<(HTMLElement | null)[]>([]);
  const ringRefs = useRef<(HTMLElement | null)[]>([]);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const stationRefs = useRef<(HTMLElement | null)[]>([]);
  const beatRefs = useRef<(HTMLElement | null)[]>([]);
  const fxCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    let cleanup = () => {};
    // Preload the plates the user is about to scroll into.
    const idle = setTimeout(() => {
      [A.robotFloor, A.robotsHandoff, A.darboPortrait, A.commandCenter].forEach((src) => {
        const i = new Image();
        i.src = src;
      });
    }, 400);
    const lowPower =
      window.matchMedia("(max-width: 768px)").matches || (navigator.hardwareConcurrency || 8) < 5;
    const fx = createWhoFx(fxCanvas.current!, lowPower);

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
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      const prog = { p: 0 };
      const tween = gsap.to(prog, {
        p: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.8 },
      });
      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.ticker.remove(tick);
        lenis.destroy();
        delete (window as unknown as { __lenis?: unknown }).__lenis;
      };
      (root.current as unknown as { __prog?: { p: number } }).__prog = prog;
    })();

    const start = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = (performance.now() - start) / 1000;
      const prog = (root.current as unknown as { __prog?: { p: number } } | null)?.__prog;
      if (!prog) return;
      const p = prog.p;
      const R = r.current;
      const st = (k: string, css: Partial<CSSStyleDeclaration>) => {
        const el = R[k];
        if (el) Object.assign(el.style, css);
      };
      const s1 = local(p, 0), s2 = local(p, 1), s3 = local(p, 2), s4 = local(p, 3), s5 = local(p, 4), s6 = local(p, 5);

      // Scene 1 -> 2 is cut by a light sweep, not a hard edit.
      const sw = seg(p, SCENES[1]![0] - 0.03, SCENES[1]![0] + 0.03);
      const cut = seg(sw, 0.42, 0.58);
      st("sweep", { opacity: sw > 0 && sw < 1 ? "1" : "0", transform: `translateX(${-130 + 260 * sw}vw)` });

      // ---------- Scene 1: The Voice ----------
      const vis1 = 1 - cut;
      st("stg", {
        opacity: String(seg(s1, 0.02, 0.14) * vis1),
        transform: `scale(${1.04 + 0.1 * ease(s1)})`,
        filter: `brightness(${(0.35 + 0.65 * seg(s1, 0.05, 0.5)).toFixed(2)})`,
      });
      st("spot", { opacity: String(seg(s1, 0, 0.3) * vis1), transform: `scale(${0.7 + 0.7 * ease(s1)})` });
      STAGE_SCREENS.forEach((_, i) => {
        const el = screenRefs.current[i];
        if (!el) return;
        const on = ease(seg(s1, 0.28 + i * 0.06, 0.4 + i * 0.06));
        el.style.opacity = String((0.05 + on * 0.95) * vis1);
      });
      st("au", {
        opacity: String(vis1),
        transform: `translate(${s1 * -4}vw, ${s1 * 6}vh)`,
        filter: `blur(${(10 - 7 * ease(s1)).toFixed(1)}px)`,
      });
      const rev = (v: number, a: number, b: number) => ease(seg(v, a, b));
      st("l1", { opacity: String(rev(s1, 0.3, 0.44) * vis1), transform: `translateY(${(1 - rev(s1, 0.3, 0.44)) * 34}px)` });
      st("l2", { opacity: String(rev(s1, 0.44, 0.58) * vis1), transform: `translateY(${(1 - rev(s1, 0.44, 0.58)) * 34}px)` });
      st("l1s", { opacity: String(rev(s1, 0.64, 0.8) * vis1), transform: `translateY(${(1 - rev(s1, 0.64, 0.8)) * 20}px)` });

      // ---------- Scene 2: The Floor ----------
      const vis2 = cut * (1 - seg(p, SCENES[1]![1] - 0.02, SCENES[1]![1]));
      st("flr", {
        opacity: String(vis2),
        transform: `translateX(${6 - 16 * ease(s2)}vw) scale(1.18)`,
        filter: `brightness(${(0.35 + 0.65 * seg(s2, 0, 0.35)).toFixed(2)})`,
      });
      st("flrFg", { opacity: String(vis2 * 0.9), transform: `translateX(${12 - 30 * ease(s2)}vw)` });
      st("scan", { opacity: String(vis2 * 0.6) });
      STATIONS.forEach((_, i) => {
        const ring = ringRefs.current[i];
        const line = lineRefs.current[i];
        const on = ease(seg(s2, 0.15 + i * 0.05, 0.24 + i * 0.05));
        if (ring) {
          ring.style.opacity = String(vis2 * (0.12 + 0.88 * on));
          ring.style.transform = `translate(-50%,-50%) scale(${(0.75 + 0.25 * on).toFixed(2)})`;
        }
        if (line) {
          line.style.strokeDashoffset = String(1 - seg(s2, 0.22 + i * 0.05, 0.5 + i * 0.05));
          line.style.opacity = String(vis2 * 0.9);
        }
      });
      st("core", {
        opacity: String(vis2 * seg(s2, 0.28, 0.48)),
        transform: `translate(-50%,-50%) scale(${(1 + 0.08 * Math.sin(t * 2.2)).toFixed(3)})`,
      });
      const tick2 = ease(seg(s2, 0.45, 0.98));
      const c1 = R.c1, c2 = R.c2, c3 = R.c3;
      if (c1) c1.textContent = fmt(Math.floor(52480 * tick2));
      if (c2) c2.textContent = fmt(Math.floor(13790 * tick2));
      if (c3) c3.textContent = fmt(Math.floor(20520 * tick2));
      st("cblock", { opacity: String(vis2 * seg(s2, 0.5, 0.6)), transform: `translateY(${(1 - seg(s2, 0.5, 0.6)) * 20}px)` });
      st("ch1", { opacity: String(vis2 * rev(s2, 0.55, 0.68)), transform: `translateY(${(1 - rev(s2, 0.55, 0.68)) * 34}px)` });
      st("ch2", { opacity: String(vis2 * rev(s2, 0.63, 0.76)), transform: `translateY(${(1 - rev(s2, 0.63, 0.76)) * 34}px)` });
      st("cstmt", { opacity: String(vis2 * rev(s2, 0.8, 0.9)) });

      // ---------- Scene 3: The Connection ----------
      const vis3 = seg(p, SCENES[1]![1] - 0.02, SCENES[1]![1] + 0.02) * (1 - seg(p, SCENES[2]![1] - 0.02, SCENES[2]![1]));
      const cover = 1 - seg(s3, 0.78, 0.92); // panels hide as the cutaway takes the frame
      st("p3l", { opacity: String(vis3 * cover), transform: `scale(${(1.06 - 0.06 * ease(s3)).toFixed(3)})` });
      st("p3r", { opacity: String(vis3 * cover), transform: `scale(${(1.08 - 0.06 * ease(s3)).toFixed(3)})` });
      st("seam", {
        opacity: String(vis3 * cover * seg(s3, 0.05, 0.15)),
        transform: `scaleY(${(0.4 + 0.6 * seg(s3, 0.05, 0.25)).toFixed(3)})`,
      });
      const fl1 = seg(s3, 0.15, 0.38), fl2 = seg(s3, 0.34, 0.55);
      st("strm1", { opacity: String(vis3 * cover * fl1), transform: `scaleX(${ease(fl1).toFixed(3)})` });
      st("strm2", { opacity: String(vis3 * cover * fl2), transform: `scaleX(${ease(fl2).toFixed(3)})` });
      const ck = ease(seg(s3, 0.5, 0.92));
      st("cut", {
        opacity: String(vis3 * seg(s3, 0.5, 0.6)),
        transform: `translate(-50%,-50%) scale(${(0.08 + 0.92 * ck).toFixed(3)})`,
      });
      st("h3", { opacity: String(vis3 * rev(s3, 0.2, 0.34) * (1 - seg(s3, 0.85, 0.95))), transform: `translateY(${(1 - rev(s3, 0.2, 0.34)) * 34}px)` });
      st("sub3", { opacity: String(vis3 * rev(s3, 0.3, 0.44) * (1 - seg(s3, 0.85, 0.95))), transform: `translateY(${(1 - rev(s3, 0.3, 0.44)) * 20}px)` });

      // ---------- Scene 4: The Person Behind It ----------
      const vis4 = seg(p, SCENES[2]![1] - 0.02, SCENES[2]![1] + 0.02) * (1 - seg(p, SCENES[3]![1] - 0.02, SCENES[3]![1]));
      st("por", { opacity: String(vis4), transform: `scale(${(1.06 - 0.06 * ease(s4)).toFixed(3)})` });
      const wr = ease(seg(s4, 0.05, 0.55)) - ease(seg(s4, 0.6, 0.95));
      st("wire", { opacity: String(vis4 * (wr > 0.01 ? 0.95 : 0)) });
      R.wire?.style.setProperty("--wire-r", `${(Math.max(0, wr) * 46).toFixed(1)}vmax`);
      beatRefs.current.forEach((el, i) => {
        if (!el) return;
        const a = 0.12 + i * 0.24, b = a + 0.1, e = a + 0.18, f = e + 0.06;
        const o = ease(seg(s4, a, b)) * (1 - seg(s4, e, f));
        el.style.opacity = String(vis4 * o);
        el.style.transform = `translateY(${(1 - o) * 20}px)`;
      });
      st("h4", { opacity: String(vis4 * rev(s4, 0.8, 0.94)), transform: `translateY(${(1 - rev(s4, 0.8, 0.94)) * 30}px)` });

      // ---------- Scene 5: How We Work (horizontal) ----------
      const vis5 = seg(p, SCENES[3]![1] - 0.02, SCENES[3]![1] + 0.02) * (1 - seg(p, SCENES[4]![1] - 0.02, SCENES[4]![1]));
      const track = R.track;
      if (track) {
        const over = Math.max(0, track.scrollWidth - window.innerWidth);
        track.style.transform = `translateX(${-ease(seg(s5, 0.03, 0.97)) * over}px)`;
        track.style.opacity = String(vis5);
      }
      const s5line = R.s5line;
      if (s5line) {
        s5line.style.strokeDashoffset = String(1 - seg(s5, 0.05, 0.92));
        s5line.style.opacity = String(vis5);
      }
      stationRefs.current.forEach((el, i) => {
        if (!el) return;
        const o = seg(s5, 0.06 + i * 0.17, 0.14 + i * 0.17);
        el.style.opacity = String(vis5 * o);
        el.style.transform = `translateY(${(1 - o) * 40}px)`;
      });
      st("e5", { opacity: String(vis5) });

      // ---------- Scene 6: The Invitation ----------
      const vis6 = seg(p, SCENES[4]![1] - 0.02, SCENES[4]![1] + 0.02);
      st("cc", {
        opacity: String(vis6),
        transform: `translateY(${(2 - 4 * s6).toFixed(2)}vh) scale(${(1.12 - 0.1 * s6).toFixed(3)})`,
      });
      st("ct6", { opacity: String(vis6 * ease(seg(s6, 0.3, 0.55))), transform: `translateY(${(1 - ease(seg(s6, 0.3, 0.55))) * 24}px)` });

      // ---------- Canvas fx + HUD ----------
      fx.size();
      fx.clear();
      fx.streams(vis2 * seg(s2, 0.35, 0.6), t, STATIONS, CORE);
      fx.dust(vis1 * 0.7 + vis4 * 0.5, t);
      st("bar", { transform: `scaleX(${p})` });
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      cleanup();
    };
  }, []);

  return (
    <section ref={root} aria-label="Who we are" className="who-page relative bg-stage" style={{ "--who-total": TOTAL_VH } as CSSProperties}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* ---- Scene 1: The Voice ---- */}
        <img ref={set("stg")} src={A.stageDarbo} alt="Darbo on stage, addressing a room" width={1024} height={1024} decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-0" />
        <div ref={set("spot")} className="who-spot pointer-events-none absolute inset-0 opacity-0" />
        <div className="absolute inset-0">
          {STAGE_SCREENS.map((s, i) => (
            <div
              key={i}
              ref={(el) => { screenRefs.current[i] = el; }}
              className="who-scr absolute opacity-0"
              style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.w * 100}%`, height: `${s.h * 100}%` }}
            />
          ))}
        </div>
        <div ref={set("au")} className="pointer-events-none absolute inset-x-0 bottom-0 h-[26vh]">
          {[6, 18, 31, 45, 58, 72, 85, 94].map((x, i) => (
            <span key={x} className="who-head absolute" style={{ left: `${x}%`, bottom: `${-4 + (i % 3) * 3}%`, width: `${9 + (i % 4) * 2.5}vw`, height: `${11 + (i % 3) * 3}vh` }} />
          ))}
        </div>
        <div className="absolute bottom-[14vh] left-[6vw] max-w-[92vw]">
          <h2 className="title-card">
            <span ref={set("l1")} className="block opacity-0">{COPY.s1.l1}</span>
            <span ref={set("l2")} className="block opacity-0">{COPY.s1.l2}</span>
          </h2>
          <p ref={set("l1s")} className="title-card title-card--small mt-6 opacity-0">{COPY.s1.sub}</p>
        </div>

        {/* ---- Scene 2: The Floor ---- */}
        <img ref={set("flr")} src={A.robotFloor} alt="Rows of robots working at lit workstations" width={1024} height={1024} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-0" />
        <div ref={set("flrFg")} className="who-fgmask pointer-events-none absolute inset-x-0 bottom-0 h-[42vh] opacity-0">
          <img src={A.robotFloor} alt="" aria-hidden width={1024} height={1024} loading="lazy" decoding="async" className="h-full w-full object-cover" style={{ objectPosition: "50% 88%", transform: "scale(1.5)" }} />
        </div>
        <div ref={set("scan")} className="who-scan pointer-events-none absolute inset-0 opacity-0" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {STATIONS.map((s, i) => (
            <path
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              d={`M ${s.x * 100} ${s.y * 100} Q ${(s.x + CORE.x) * 50} ${((s.y + CORE.y) / 2) * 100 - 3} ${CORE.x * 100} ${CORE.y * 100}`}
              pathLength={1}
              className="cine-thread"
              style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 }}
            />
          ))}
        </svg>
        <div ref={set("core")} className="who-core pointer-events-none absolute opacity-0" style={{ left: `${CORE.x * 100}%`, top: `${CORE.y * 100}%`, width: "22vmin", height: "22vmin" }} />
        {STATIONS.map((s, i) => (
          <span
            key={i}
            ref={(el) => { ringRefs.current[i] = el; }}
            className="who-ring pointer-events-none absolute h-6 w-6 opacity-0"
            style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
          />
        ))}
        <div ref={set("cblock")} className="absolute right-[6vw] top-[18vh] text-right opacity-0">
          {[COPY.s2.counters[0], COPY.s2.counters[1], COPY.s2.counters[2]].map((label, i) => (
            <div key={label} className="mb-5">
              <p className="who-counter text-2xl font-medium md:text-3xl" ref={i === 0 ? set("c1") : i === 1 ? set("c2") : set("c3")}>0</p>
              <p className="eyebrow mt-1">{label}</p>
            </div>
          ))}
        </div>
        <div className="absolute bottom-[12vh] left-[6vw] max-w-[92vw]">
          <h2 className="title-card">
            <span ref={set("ch1")} className="block opacity-0">{COPY.s2.l1}</span>
            <span ref={set("ch2")} className="block opacity-0">{COPY.s2.l2}</span>
          </h2>
          <p ref={set("cstmt")} className="eyebrow mt-6 opacity-0">{COPY.s2.stmt}</p>
        </div>

        {/* ---- Scene 3: The Connection ---- */}
        <div ref={set("p3l")} className="absolute inset-y-0 left-0 w-1/2 overflow-hidden opacity-0">
          <img src={A.stageDarbo} alt="" aria-hidden width={1024} height={1024} loading="lazy" decoding="async" className="h-full w-full object-cover" style={{ objectPosition: "62% 30%" }} />
        </div>
        <div ref={set("p3r")} className="absolute inset-y-0 right-0 w-1/2 overflow-hidden opacity-0">
          <img src={A.robotFloor} alt="" aria-hidden width={1024} height={1024} loading="lazy" decoding="async" className="h-full w-full object-cover" style={{ objectPosition: "40% 50%" }} />
        </div>
        <div ref={set("seam")} className="who-seam pointer-events-none absolute inset-y-0 left-1/2 w-[2px] opacity-0" />
        <div ref={set("strm1")} className="who-stream pointer-events-none absolute left-[30%] top-[52%] h-[3px] w-[20%] origin-left opacity-0" />
        <div ref={set("strm2")} className="who-stream pointer-events-none absolute left-1/2 top-[52%] h-[3px] w-[24%] origin-left opacity-0" />
        <div ref={set("cut")} className="pointer-events-none absolute left-1/2 top-1/2 h-screen w-screen overflow-hidden opacity-0">
          <img src={A.robotsHandoff} alt="Two robots passing a glowing chip in a server room" width={1024} height={1024} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
        <div className="absolute left-[6vw] top-[16vh] max-w-[92vw]">
          <h2 ref={set("h3")} className="title-card opacity-0">{COPY.s3.h}</h2>
          <p ref={set("sub3")} className="title-card title-card--small mt-6 opacity-0">{COPY.s3.sub}</p>
        </div>

        {/* ---- Scene 4: The Person Behind It ---- */}
        <img ref={set("por")} src={A.darboPortrait} alt="Portrait of Darbo, half rendered as a blue wireframe" width={1024} height={1024} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-0" />
        <div ref={set("wire")} className="who-wire pointer-events-none absolute inset-0 opacity-0">
          <img src={A.darboPortrait} alt="" aria-hidden width={1024} height={1024} loading="lazy" decoding="async" className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
        </div>
        <div className="absolute bottom-[12vh] left-[6vw] max-w-[40ch]">
          {COPY.s4.beats.map((beat, i) => (
            <p key={i} ref={(el) => { beatRefs.current[i] = el; }} className="mb-4 text-base text-muted-foreground opacity-0 md:text-lg">
              {beat}
            </p>
          ))}
          <h2 ref={set("h4")} className="title-card title-card--small mt-6 opacity-0">{COPY.s4.h}</h2>
        </div>

        {/* ---- Scene 5: How We Work (horizontal track) ---- */}
        <div ref={set("track")} className="absolute inset-y-0 left-0 flex h-full w-max items-center gap-[6vw] pl-[10vw] pr-[14vw] opacity-0 will-change-transform">
          <svg className="pointer-events-none absolute inset-x-0 top-[54%] h-[12vh] w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <path
              ref={set("s5line") as never}
              d="M 1 60 C 22 57, 45 62, 68 58 S 94 57, 99 59"
              pathLength={1}
              className="cine-thread"
              style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 }}
            />
          </svg>
          {COPY.s5.stations.map((stn, i) => (
            <article
              key={stn.t}
              ref={(el) => { stationRefs.current[i] = el; }}
              className={`s5-t${i + 1} relative w-[72vw] shrink-0 border border-border p-10 opacity-0 md:w-[58vw] md:p-14`}
            >
              {i === 0 && (
                <>
                  <span className="who-bracket left-0 top-0 border-l-2 border-t-2" />
                  <span className="who-bracket right-0 top-0 border-r-2 border-t-2" />
                  <span className="who-bracket bottom-0 left-0 border-b-2 border-l-2" />
                  <span className="who-bracket bottom-0 right-0 border-b-2 border-r-2" />
                  <p className="eyebrow absolute -top-3 left-6 bg-stage px-2">51.2°N — 0.1°W · STATION 01</p>
                </>
              )}
              <p className="eyebrow mb-6">0{i + 1}</p>
              <h3 className="text-3xl font-bold md:text-5xl" style={{ fontStretch: "115%" }}>{stn.t}</h3>
              <p className="mt-5 max-w-[36ch] text-muted-foreground">{stn.d}</p>
            </article>
          ))}
        </div>
        <p ref={set("e5")} className="eyebrow absolute left-[6vw] top-[14vh] opacity-0">{COPY.s5.eyebrow}</p>

        {/* ---- Scene 6: The Invitation ---- */}
        <img ref={set("cc")} src={A.commandCenter} alt="Two leaders at a holographic command room" width={1024} height={1024} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-0" />
        <div className="absolute inset-0 bg-stage/60" />
        <div ref={set("ct6")} className="absolute bottom-[16vh] left-[6vw] max-w-[92vw] opacity-0">
          <h2 className="title-card max-w-[12ch]">{COPY.s6.h}</h2>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <a href={`mailto:${COPY.s6.mail}`} className="who-cta">{COPY.s6.cta}</a>
            <a href={`mailto:${COPY.s6.mail}`} className="eyebrow hover:text-foreground">{COPY.s6.mail}</a>
          </div>
        </div>

        {/* ---- Shared overlays ---- */}
        <div className="who-grade pointer-events-none absolute inset-0" />
        <canvas ref={fxCanvas} className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="vignette pointer-events-none absolute inset-0" />
        <div ref={set("sweep")} className="who-sweep pointer-events-none absolute inset-y-0 left-0 z-30 h-full w-[70vw] opacity-0" />

        <WhoHeader />
        {/* HUD: gold progress hairline, one marker per scene */}
        <div className="absolute right-[6vw] top-1/2 z-10 hidden -translate-y-1/2 md:block">
          <div className="relative h-[34vh] w-px bg-hud-track">
            <div ref={set("bar")} className="absolute inset-0 origin-top bg-gold" style={{ transform: "scaleY(0)" }} />
            {SCENES.map(([s], i) => (
              <span key={i} className="eyebrow absolute -left-7 -translate-y-1/2" style={{ top: `${s * 100}%` }}>
                0{i + 1}
              </span>
            ))}
          </div>
        </div>
        <p className="eyebrow absolute bottom-6 left-[6vw] z-10">Scroll</p>
      </div>
    </section>
  );
}

/* Reduced-motion fallback: the same story as calm, static sections. */
function WhoStatic() {
  return (
    <div className="px-[6vw] pb-24 pt-8">
      <WhoHeaderFallback />
      {[
        { img: A.stageDarbo, alt: "Darbo on stage, addressing a room", h: `${COPY.s1.l1} ${COPY.s1.l2}`, p: COPY.s1.sub },
        { img: A.robotFloor, alt: "Rows of robots working at lit workstations", h: `${COPY.s2.l1} ${COPY.s2.l2}`, p: `${COPY.s2.stmt} — ${COPY.s2.counters.join(", ").toLowerCase()}.` },
        { img: A.robotsHandoff, alt: "Two robots passing a glowing chip", h: COPY.s3.h, p: COPY.s3.sub },
        { img: A.darboPortrait, alt: "Portrait of Darbo, half rendered as a blue wireframe", h: COPY.s4.h, p: COPY.s4.beats.join(" ") },
      ].map((s) => (
        <section key={s.h} className="relative flex min-h-[80vh] items-end overflow-hidden border-b border-border py-12">
          <img src={s.img} alt={s.alt} width={1024} height={1024} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          <div className="relative">
            <h2 className="title-card">{s.h}</h2>
            <p className="title-card title-card--small mt-6 max-w-[46ch]">{s.p}</p>
          </div>
        </section>
      ))}
      <section className="py-16">
        <p className="eyebrow mb-8">{COPY.s5.eyebrow}</p>
        <ol className="grid gap-8 md:grid-cols-5">
          {COPY.s5.stations.map((stn, i) => (
            <li key={stn.t}>
              <p className="eyebrow mb-3">0{i + 1}</p>
              <h3 className="text-xl font-bold" style={{ fontStretch: "115%" }}>{stn.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{stn.d}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="relative overflow-hidden py-24">
        <img src={A.commandCenter} alt="" aria-hidden width={1024} height={1024} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="relative">
          <h2 className="title-card max-w-[12ch]">{COPY.s6.h}</h2>
          <a href={`mailto:${COPY.s6.mail}`} className="who-cta mt-10 inline-block">{COPY.s6.cta}</a>
        </div>
      </section>
    </div>
  );
}

function WhoHeaderFallback() {
  return (
    <header className="flex items-center justify-between pb-16 pt-4">
      {logo}
      <Link to="/" className="eyebrow hover:text-foreground">Home</Link>
    </header>
  );
}
