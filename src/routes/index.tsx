import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cinematic, StaticIntro } from "@/cinematic/Cinematic";
import { CINEMATIC_ASSETS } from "@/cinematic/config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadZLoco™ — Architect of Headless Agentic AI Systems" },
      { name: "description", content: "Building businesses that scale without limits. Headless agentic AI systems, architected by Darbo." },
      { property: "og:title", content: "LeadZLoco™ — Architect of Headless Agentic AI Systems" },
      { property: "og:description", content: "Building businesses that scale without limits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  const skip = () => {
    const el = document.getElementById("home");
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: Element, o?: object) => void } }).__lenis;
    if (el && lenis) lenis.scrollTo(el, { duration: 1.4 });
    else el?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <main className="bg-stage">
      {reduced ? <StaticIntro onSkip={skip} /> : <Cinematic onSkip={skip} />}
      <Home />
    </main>
  );
}

const ROWS = [
  { n: "01", t: "Systems that think ahead", d: "Agentic architecture that works quietly behind your brand — wherever your customers are." },
  { n: "02", t: "Headless by design", d: "Your front end stays yours. Intelligence plugs in underneath, ready to scale." },
  { n: "03", t: "Built around people", d: "Technology evolves. The vision, the judgement and the relationships stay human." },
];

function Home() {
  return (
    <div id="home" className="relative bg-stage text-foreground">
      <header className="flex items-center justify-between px-[6vw] py-8">
        <span className="font-display text-xl font-black tracking-tight" style={{ fontStretch: "125%" }}>
          <span className="logo-lead">LeadZ</span><span className="logo-loco">Loco</span>
          <sup className="logo-tm">™</sup>
        </span>
        <nav className="flex gap-8">
          <Link to="/who-we-are" className="eyebrow hover:text-foreground">Who we are</Link>
          <a href="#work" className="eyebrow hover:text-foreground">Approach</a>
          <a href="#contact" className="eyebrow hover:text-foreground">Contact</a>
        </nav>
      </header>

      <section className="grid items-end gap-10 px-[6vw] pb-24 pt-10 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="eyebrow mb-6">Architect of Headless Agentic AI Systems</p>
          <h1 className="title-card max-w-none">Building businesses that scale without limits.</h1>
          <a href="#contact" className="hud-btn mt-10 inline-block">Start the conversation</a>
        </div>
        <div className="relative md:col-span-5">
          <div className="cine-rim absolute inset-0" />
          <img src={CINEMATIC_ASSETS.darboHuman} alt="Darbo, founder of LeadZLoco" width={896} height={1200} loading="lazy" className="relative ml-auto w-full max-w-md" />
        </div>
      </section>

      <section id="work" className="border-t border-border px-[6vw] py-24">
        {ROWS.map((r, i) => (
          <div key={r.n} className={`grid gap-6 border-b border-border py-12 md:grid-cols-12 ${i % 2 ? "md:text-right" : ""}`}>
            <span className={`eyebrow md:col-span-2 ${i % 2 ? "md:order-last" : ""}`}>{r.n}</span>
            <h3 className="text-3xl font-bold md:col-span-6 md:text-5xl" style={{ fontStretch: "115%" }}>{r.t}</h3>
            <p className="text-muted-foreground md:col-span-4">{r.d}</p>
          </div>
        ))}
      </section>

      <section id="contact" className="px-[6vw] py-32">
        <p className="eyebrow mb-6">Let's build</p>
        <h2 className="title-card max-w-[14ch]">The next evolution starts with a conversation.</h2>
        <a href="mailto:hello@leadzloco.com" className="hud-btn mt-10 inline-block">Start the conversation</a>
      </section>

      <footer className="flex flex-wrap gap-4 justify-between border-t border-border px-[6vw] py-8">
        <span className="eyebrow">© LeadZLoco™</span>
        <Link to="/who-we-are" className="eyebrow hover:text-foreground">Who we are</Link>
        <span className="eyebrow">Technology evolves. Vision remains human.</span>
      </footer>
    </div>
  );
}
