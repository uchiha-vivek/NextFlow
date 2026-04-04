"use client";

import { useState } from "react";
import { AppShell } from "@/components/sidebars/app-shell";

const homeCards = [
  {
    title: "Generate Image",
    image:
      "linear-gradient(135deg, #f3bd1e 0%, #d8a612 100%)",
    badge: "Image",
  },
  {
    title: "Generate Video",
    image:
      "linear-gradient(135deg, #3c2616 0%, #0d0a07 100%)",
    badge: "Video",
  },
  {
    title: "Upscale & Enhance",
    image:
      "linear-gradient(135deg, #2f2f2f 0%, #0f0f10 100%)",
    badge: "Enhance",
  },
  {
    title: "Realtime",
    image:
      "linear-gradient(135deg, #2a1a14 0%, #0f0f10 100%)",
    badge: "Realtime",
  },
];

export default function HomePage() {
  const [heroGlow, setHeroGlow] = useState({ x: 50, y: 50 });

  return (
    <main className="h-screen overflow-hidden bg-[#141414] text-white">
      <AppShell>
        <section className="h-full overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
          <div className="mx-auto max-w-none">
            <div
              className="hero-banner group relative overflow-hidden rounded-[24px] border border-white/6 px-10 py-24 shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
              onMouseMove={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - bounds.left) / bounds.width) * 100;
                const y = ((event.clientY - bounds.top) / bounds.height) * 100;
                setHeroGlow({ x, y });
              }}
              style={
                {
                  "--hero-glow-x": `${heroGlow.x}%`,
                  "--hero-glow-y": `${heroGlow.y}%`,
                } as React.CSSProperties
              }
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#6ea5e7_0%,#5f97db_28%,#4e83c8_55%,#5a89c9_100%)]" />
              <div className="hero-banner__glow pointer-events-none absolute inset-0" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_24%),radial-gradient(circle_at_80%_70%,rgba(174,214,255,0.18),transparent_32%)]" />
              <div className="relative z-10 flex flex-col items-center">
                <h1 className="text-center text-5xl font-medium tracking-[-0.05em] text-white sm:text-6xl">
                  Start by generating a free image
                </h1>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <button className="flex min-w-[242px] items-center justify-center rounded-full bg-white px-8 py-4 text-[18px] font-medium text-black shadow-[0_12px_30px_rgba(255,255,255,0.16)] transition-transform duration-300 hover:-translate-y-0.5">
                    Generate Image
                    <span className="ml-3 text-2xl leading-none">→</span>
                  </button>
                  <button className="flex min-w-[242px] items-center justify-center rounded-full border border-white/10 bg-white/[0.08] px-8 py-4 text-[18px] font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/[0.12]">
                    Generate Video
                    <span className="ml-3 text-2xl leading-none">→</span>
                  </button>
                </div>
              </div>
              <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2">
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white/80 transition-colors hover:bg-black/30 hover:text-white">
                  ←
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white/80 transition-colors hover:bg-black/30 hover:text-white">
                  →
                </button>
              </div>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {homeCards.map((card) => (
                <div key={card.title} className="group">
                  <div
                    className="relative h-[180px] overflow-hidden rounded-[22px] border border-white/6 shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition-transform duration-300 group-hover:-translate-y-1"
                    style={{ background: card.image }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_42%)]" />
                    <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-black/30 text-sm font-semibold text-white backdrop-blur-md">
                      {card.badge}
                    </div>
                  </div>
                  <div className="mt-4 text-[18px] font-medium tracking-[-0.03em] text-white">
                    {card.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AppShell>
    </main>
  );
}
