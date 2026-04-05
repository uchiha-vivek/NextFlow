"use client";

import { useState, type CSSProperties } from "react";
import {
  ArrowRight,
  BookOpenText,
  Camera,
  Globe,
  Newspaper,
  X as XIcon,
} from "lucide-react";
import { AppShell } from "@/components/sidebars/app-shell";

const homeCards = [
  {
    title: "Generate Image",
    image: "linear-gradient(135deg, #f3bd1e 0%, #d8a612 100%)",
    badge: "Image",
    kind: "image",
  },
  {
    title: "Generate Video",
    image: "linear-gradient(135deg, #3c2616 0%, #0d0a07 100%)",
    badge: "Video",
    kind: "video",
  },
  {
    title: "Upscale & Enhance",
    image: "linear-gradient(135deg, #2f2f2f 0%, #0f0f10 100%)",
    badge: "Enhance",
    kind: "enhance",
  },
  {
    title: "Realtime",
    image: "linear-gradient(135deg, #2a1a14 0%, #0f0f10 100%)",
    badge: "Realtime",
    kind: "realtime",
  },
];

const releaseNotes = [
  {
    title: "Seedance 2.0: now on NextFlow",
    description:
      "Seedance 2.0 is available for business accounts outside the US and India. Best-in-class motion coherence is now easier to access.",
    date: "Apr 2, 2026",
    image: "linear-gradient(135deg, #b4c2d9 0%, #d7cbc2 100%)",
  },
  {
    title: "Annotations in NextFlow Edit",
    description:
      "Mark up multiple regions, write a separate prompt for each one, and generate all the changes in a single pass.",
    date: "Mar 26, 2026",
    image: "linear-gradient(135deg, #a6acbc 0%, #d76d57 100%)",
  },
  {
    title: "Announcing the NextFlow Node Agent",
    description:
      "Describe what you want, and watch our agent make it happen. Creative workflows, without the complexity.",
    date: "Mar 18, 2026",
    image: "linear-gradient(135deg, #bcc6d1 0%, #808996 100%)",
  },
  {
    title: "A New, More Powerful NextFlow Edit",
    description:
      "Change specific regions, render new perspectives, adjust lighting, apply color palettes, and more with a rebuilt editing tool.",
    date: "Mar 9, 2026",
    image: "linear-gradient(135deg, #e9db87 0%, #b98d26 100%)",
  },
];

const footerColumns = [
  {
    title: "NextFlow",
    links: ["Log In", "Pricing", "Plans", "Teams", "Enterprise", "Gallery", "For Architecture"],
  },
  {
    title: "Products",
    links: ["Image", "Video", "Enhancer", "Realtime", "Edit", "Chat", "Stage", "Animator", "Train"],
  },
  {
    title: "Resources",
    links: ["Pricing", "Careers", "Terms of Service", "Privacy Policy", "Documentation", "Models"],
  },
  {
    title: "About",
    links: ["Blog", "Discord", "Articles"],
  },
];

function ReleaseNoteCard({
  title,
  description,
  date,
  image,
}: {
  title: string;
  description: string;
  date: string;
  image: string;
}) {
  return (
    <article className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
      <div
        className="relative h-[174px] overflow-hidden rounded-[22px] border border-white/6 shadow-[0_18px_40px_rgba(0,0,0,0.2)]"
        style={{ background: image }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.32),transparent_36%)]" />
        <div className="absolute inset-5 rounded-[16px] border border-black/8 bg-white/85 shadow-[0_18px_50px_rgba(0,0,0,0.08)]" />
        <div className="absolute left-9 top-10 text-[22px] font-semibold tracking-[-0.04em] text-[#27272a]">
          {title.split(":")[0]}
        </div>
      </div>
      <div className="flex flex-col justify-center">
        <h3 className="max-w-[20rem] text-[22px] font-medium tracking-[-0.04em] text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="mt-3 max-w-[24rem] text-[15px] leading-7 text-[var(--text-soft)]">{description}</p>
        <div className="mt-8 text-[15px] text-[var(--text-muted)]">{date}</div>
      </div>
    </article>
  );
}

export function AppHome() {
  const [heroGlow, setHeroGlow] = useState({ x: 50, y: 50 });

  return (
    <main className="h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--text-primary)]">
      <AppShell>
        <section className="sidebar-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
          <div className="mx-auto max-w-none">
            <div
              className="hero-banner group relative overflow-hidden rounded-[24px] border border-[color:var(--border-soft)] px-10 py-24 shadow-[var(--shadow-elevated)]"
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
                } as CSSProperties
              }
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#6ea5e7_0%,#5f97db_28%,#4e83c8_55%,#5a89c9_100%)]" />
              <div className="hero-banner__glow pointer-events-none absolute inset-0" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_24%),radial-gradient(circle_at_80%_70%,rgba(174,214,255,0.18),transparent_32%)]" />
              <div className="relative z-10 flex flex-col items-center">
                <h1 className="text-center text-5xl font-medium tracking-[-0.05em] text-[var(--text-primary)] sm:text-6xl">
                  Start by generating a free image
                </h1>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <button className="flex min-w-[242px] items-center justify-center rounded-full bg-[var(--surface-0)] px-8 py-4 text-[18px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-panel)] transition-transform duration-300 hover:-translate-y-0.5">
                    Generate Image
                    <span className="ml-3 text-2xl leading-none">-&gt;</span>
                  </button>
                  <button className="flex min-w-[242px] items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-3)] px-8 py-4 text-[18px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-panel)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[var(--surface-2)]">
                    Generate Video
                    <span className="ml-3 text-2xl leading-none">-&gt;</span>
                  </button>
                </div>
              </div>
              <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2">
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white/80 transition-colors hover:bg-black/30 hover:text-white">
                  &lt;-
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white/80 transition-colors hover:bg-black/30 hover:text-white">
                  -&gt;
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
                    {card.kind === "image" ? (
                      <>
                        <div className="absolute inset-x-7 top-7 h-[118px] rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(0,0,0,0.06))] shadow-[0_20px_40px_rgba(0,0,0,0.2)]" />
                        <div className="absolute inset-x-10 top-10 h-[92px] overflow-hidden rounded-[14px] border border-white/12 bg-[radial-gradient(circle_at_30%_30%,rgba(255,245,186,0.85),transparent_28%),radial-gradient(circle_at_70%_35%,rgba(255,194,92,0.7),transparent_22%),linear-gradient(135deg,#fff2b3_0%,#ffd34d_44%,#efb600_100%)]">
                          <div className="absolute bottom-0 left-0 right-0 h-10 bg-[linear-gradient(180deg,transparent,rgba(128,88,0,0.18))]" />
                          <div className="absolute left-5 top-4 h-10 w-10 rounded-full bg-white/35 blur-[1px]" />
                          <div className="absolute right-8 top-6 h-8 w-14 rounded-[999px] bg-white/25" />
                        </div>
                        <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[12px] font-semibold text-white/90 backdrop-blur-md">
                          Image
                        </div>
                      </>
                    ) : card.kind === "video" ? (
                      <>
                        <div className="absolute inset-x-8 top-7 h-[118px] rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.24))] shadow-[0_20px_40px_rgba(0,0,0,0.28)]" />
                        <div className="absolute inset-x-11 top-10 h-[92px] overflow-hidden rounded-[14px] border border-white/6 bg-[radial-gradient(circle_at_30%_30%,rgba(255,178,102,0.26),transparent_30%),linear-gradient(135deg,#1b1410_0%,#3b2418_35%,#110b08_100%)]">
                          <div className="absolute left-4 top-4 h-10 w-16 rounded-lg border border-white/10 bg-white/10" />
                          <div className="absolute right-5 top-5 h-12 w-20 rounded-xl border border-orange-300/25 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,140,72,0.12))]" />
                          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                            <div className="h-1 rounded-full bg-white/20 flex-1" />
                            <div className="h-1 rounded-full bg-white/60 w-[38%]" />
                          </div>
                        </div>
                        <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-md">
                          <div className="ml-1 h-0 w-0 border-y-[8px] border-y-transparent border-l-[13px] border-l-white" />
                        </div>
                        <div className="absolute left-4 top-4 rounded-full border border-white/8 bg-black/25 px-3 py-1 text-[12px] font-semibold text-white/90 backdrop-blur-md">
                          Video
                        </div>
                      </>
                    ) : card.kind === "enhance" ? (
                      <>
                        <div className="absolute inset-x-8 top-7 h-[118px] rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.2))] shadow-[0_20px_40px_rgba(0,0,0,0.24)]" />
                        <div className="absolute left-11 top-10 h-[92px] w-[92px] rounded-[14px] border border-white/8 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.16),transparent_24%),linear-gradient(135deg,#4a4a4d_0%,#19191b_100%)]" />
                        <div className="absolute right-11 top-10 h-[92px] w-[92px] rounded-[14px] border border-cyan-200/20 bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,0.26),transparent_22%),linear-gradient(135deg,#6b6d72_0%,#1a1b1f_100%)] shadow-[0_0_0_1px_rgba(141,245,255,0.1)]" />
                        <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-[11px] font-semibold text-white backdrop-blur-md">
                          HD
                        </div>
                        <div className="absolute left-4 top-4 rounded-full border border-white/8 bg-black/25 px-3 py-1 text-[12px] font-semibold text-white/90 backdrop-blur-md">
                          Enhance
                        </div>
                      </>
                    ) : card.kind === "realtime" ? (
                      <>
                        <div className="absolute inset-x-8 top-7 h-[118px] rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.22))] shadow-[0_20px_40px_rgba(0,0,0,0.24)]" />
                        <div className="absolute inset-x-11 top-10 h-[92px] overflow-hidden rounded-[14px] border border-white/8 bg-[radial-gradient(circle_at_30%_30%,rgba(255,226,190,0.12),transparent_26%),linear-gradient(135deg,#291b15_0%,#140f0d_100%)]">
                          <div className="absolute left-4 top-4 h-7 w-24 rounded-full bg-white/8" />
                          <div className="absolute left-4 top-16 h-2 w-28 rounded-full bg-emerald-400/80" />
                          <div className="absolute left-4 top-21 h-2 w-16 rounded-full bg-sky-300/60" />
                          <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-400/12">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.85)]" />
                          </div>
                        </div>
                        <div className="absolute left-4 top-4 rounded-full border border-white/8 bg-black/25 px-3 py-1 text-[12px] font-semibold text-white/90 backdrop-blur-md">
                          Realtime
                        </div>
                      </>
                    ) : (
                      <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-black/30 text-sm font-semibold text-white backdrop-blur-md">
                        {card.badge}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-[18px] font-medium tracking-[-0.03em] text-[var(--text-primary)]">
                    {card.title}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-20 border-t border-[color:var(--border-soft)] pt-16">
              <div className="mb-10 flex items-center justify-between gap-4">
                <div className="text-[42px] font-medium tracking-[-0.05em] text-[var(--text-primary)]">
                  Release notes
                </div>
                <button className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-2)] px-5 py-3 text-[15px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]">
                  View all
                  <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
                </button>
              </div>

              <div className="grid gap-x-10 gap-y-12 xl:grid-cols-2">
                {releaseNotes.map((item) => (
                  <ReleaseNoteCard key={item.title} {...item} />
                ))}
              </div>
            </div>

            <footer className="mt-20 border-t border-[color:var(--border-soft)] pt-12">
              <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
                {footerColumns.map((column) => (
                  <div key={column.title}>
                    <div className="text-[16px] font-medium tracking-[-0.03em] text-[var(--text-primary)]">
                      {column.title}
                    </div>
                    <div className="mt-4 space-y-2">
                      {column.links.map((link) => (
                        <div
                          key={link}
                          className="cursor-pointer text-[13px] text-[var(--text-soft)] transition-colors hover:text-[var(--text-primary)]"
                        >
                          {link}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex flex-col gap-5 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[13px] text-zinc-500">© 2026 NextFlow</div>
                <div className="flex items-center gap-4 text-zinc-500">
                  <BookOpenText className="h-5 w-5 transition-colors hover:text-white" strokeWidth={2} />
                  <XIcon className="h-5 w-5 transition-colors hover:text-white" strokeWidth={2} />
                  <Globe className="h-5 w-5 transition-colors hover:text-white" strokeWidth={2} />
                  <Camera className="h-5 w-5 transition-colors hover:text-white" strokeWidth={2} />
                  <Newspaper className="h-5 w-5 transition-colors hover:text-white" strokeWidth={2} />
                </div>
              </div>
            </footer>
          </div>
        </section>
      </AppShell>
    </main>
  );
}
