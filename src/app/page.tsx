import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  SquarePen,
  Video,
  WandSparkles,
} from "lucide-react";
import { AppShell } from "@/components/sidebars/app-shell";

const galleryCards = [
  {
    label: "Image",
    icon: ImageIcon,
    className:
      "bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.45),transparent_24%),linear-gradient(135deg,#efbc24_0%,#e7b01f_40%,#191919_140%)]",
    art: (
      <>
        <div className="absolute inset-x-10 bottom-8 h-16 rounded-full bg-black/12 blur-2xl" />
        <div className="absolute left-10 top-7 h-8 w-10 rounded-full border-2 border-dashed border-white/70" />
        <div className="absolute left-16 top-14 h-28 w-24 rotate-[-12deg] rounded-[2rem] bg-[linear-gradient(180deg,#f3df9d,#7f7059)]" />
        <div className="absolute right-10 bottom-8 h-24 w-28 rotate-[8deg] rounded-[2.2rem] bg-[linear-gradient(180deg,#29a2ff,#0d56ff)] opacity-70" />
        <div className="absolute bottom-5 right-8 h-12 w-36 rotate-[8deg] rounded-full border-4 border-[#0870d9]" />
      </>
    ),
  },
  {
    label: "Video",
    icon: Video,
    className:
      "bg-[radial-gradient(circle_at_45%_25%,rgba(255,205,72,0.22),transparent_18%),linear-gradient(180deg,#050505_0%,#050505_55%,#0b0b0b_100%)]",
    art: <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(255,185,12,0.18),transparent_20%)]" />,
  },
  {
    label: "Enhancer",
    icon: WandSparkles,
    className:
      "bg-[radial-gradient(circle_at_60%_24%,rgba(255,255,255,0.18),transparent_16%),linear-gradient(180deg,#0f0f11_0%,#050505_100%)]",
    art: (
      <>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.08),transparent_24%)]" />
        <div className="absolute left-1/2 top-1/2 h-40 w-28 -translate-x-1/2 -translate-y-1/2 rounded-[999px] bg-[linear-gradient(180deg,#d0d0d0,#222)]" />
      </>
    ),
  },
  {
    label: "Realtime",
    icon: SquarePen,
    className:
      "bg-[radial-gradient(circle_at_40%_28%,rgba(48,109,255,0.1),transparent_16%),linear-gradient(180deg,#09110d_0%,#050505_100%)]",
    art: (
      <>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_42%,rgba(190,235,255,0.18),transparent_16%)]" />
        <div className="absolute left-12 right-12 top-16 h-14 rounded-full bg-[linear-gradient(90deg,rgba(18,28,26,0),rgba(138,191,255,0.7),rgba(18,28,26,0))] blur-sm" />
      </>
    ),
  },
];

function GalleryCard({
  label,
  icon: Icon,
  className,
  art,
}: (typeof galleryCards)[number]) {
  return (
    <article
      className={`relative h-[178px] overflow-hidden rounded-[22px] border border-white/[0.04] shadow-[0_14px_40px_rgba(0,0,0,0.35)] ${className}`}
    >
      {art}
      <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffcb28,#e2a703)] shadow-[0_10px_30px_rgba(255,182,18,0.45)]">
        <Icon className="h-6 w-6 text-white" strokeWidth={2.4} />
      </div>
      <div className="absolute inset-0 rounded-[22px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
      <span className="sr-only">{label}</span>
    </article>
  );
}

export default function Home() {
  return (
    <main className="h-screen overflow-hidden bg-[#212121] text-white">
      <AppShell>
        <section className="overflow-hidden px-5 py-6 sm:px-8 lg:px-10 xl:px-12">
          <div className="mx-auto flex w-full max-w-[1320px] flex-col">
            <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(115deg,rgba(211,219,224,0.95)_0%,rgba(193,200,206,0.95)_38%,rgba(168,173,180,0.94)_100%)] shadow-[0_22px_70px_rgba(0,0,0,0.26)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_24%,rgba(223,255,255,0.7),transparent_18%),radial-gradient(circle_at_66%_36%,rgba(255,255,255,0.24),transparent_20%),radial-gradient(circle_at_50%_55%,rgba(255,255,255,0.14),transparent_30%)]" />
              <div className="absolute inset-0 rounded-[24px] border border-white/25" />
              <div className="relative flex min-h-[280px] items-center justify-center px-8 py-14 sm:min-h-[360px] lg:min-h-[452px]">
                <h1 className="max-w-5xl text-center text-[44px] font-medium tracking-[-0.055em] text-white drop-shadow-[0_8px_30px_rgba(255,255,255,0.08)] sm:text-[60px] lg:text-[74px] xl:text-[76px]">
                  Start by generating a free image
                </h1>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] text-zinc-500 backdrop-blur-sm transition-colors hover:bg-white/[0.08] hover:text-white">
                <ArrowLeft className="h-5 w-5" strokeWidth={2.1} />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] text-zinc-200 backdrop-blur-sm transition-colors hover:bg-white/[0.08]">
                <ArrowRight className="h-5 w-5" strokeWidth={2.1} />
              </button>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {galleryCards.map((card) => (
                <GalleryCard key={card.label} {...card} />
              ))}
            </div>
          </div>
        </section>
      </AppShell>
    </main>
  );
}
