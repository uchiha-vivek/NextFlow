"use client";

import { useState } from "react";
import {
  BarChart3,
  CircleDollarSign,
  CirclePlus,
  ChevronDown,
  ChevronUp,
  Crop,
  FileImage,
  FileText,
  Folder,
  Home as HomeIcon,
  ImageIcon,
  LogOut,
  PanelsTopLeft,
  Settings,
  Sparkles,
  SquarePen,
  Video,
  WandSparkles,
} from "lucide-react";
import type { WorkflowNodeKind } from "@/components/workflow/workflow-builder-context";

const primaryItems = [
  { label: "Home", icon: HomeIcon, active: true },
  { label: "Train Lora", icon: Sparkles },
  { label: "Node Editor", icon: PanelsTopLeft },
  { label: "Assets", icon: Folder },
];

const toolItems = [
  { label: "Image", icon: ImageIcon, accent: "bg-emerald-400" },
  { label: "Video", icon: Video, accent: "bg-amber-400" },
  { label: "Enhancer", icon: WandSparkles, accent: "bg-zinc-400" },
  { label: "Nano Banana", icon: Sparkles, accent: "bg-yellow-400" },
  { label: "Realtime", icon: SquarePen, accent: "bg-sky-400" },
  { label: "Edit", icon: SquarePen, accent: "bg-violet-400" },
];

const quickAccessItems: Array<{
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent: string;
  kind: WorkflowNodeKind;
}> = [
  { label: "Text", icon: FileText, accent: "bg-[#1f67ff]", kind: "text" },
  { label: "Image", icon: FileImage, accent: "bg-[#0bbf72]", kind: "imageUpload" },
  { label: "Video", icon: Video, accent: "bg-[#ffb000]", kind: "videoUpload" },
  { label: "LLM", icon: Sparkles, accent: "bg-[#8a5cff]", kind: "llm" },
  { label: "Crop", icon: Crop, accent: "bg-[#ff6b35]", kind: "crop" },
  { label: "Extract", icon: PanelsTopLeft, accent: "bg-[#00b6ff]", kind: "extractFrame" },
];

type AppSidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onQuickAddNode?: (kind: WorkflowNodeKind) => void;
};

type SidebarButtonProps = {
  collapsed: boolean;
  label: string;
  active?: boolean;
  trailing?: React.ReactNode;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconClassName?: string;
  iconWrapperClassName?: string;
};

function SidebarButton({
  collapsed,
  label,
  active,
  trailing,
  icon: Icon,
  iconClassName,
  iconWrapperClassName,
}: SidebarButtonProps) {
  return (
    <button
      className={[
        "flex w-full items-center text-left text-[15px] font-medium tracking-[-0.028em] transition-colors",
        collapsed ? "h-10 justify-center px-0 rounded-xl" : "h-11 gap-3 rounded-[14px] px-4",
        active ? "bg-[#2f2f2f] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" : "text-zinc-100 hover:bg-white/[0.04]",
      ].join(" ")}
      title={collapsed ? label : undefined}
    >
      <span
        className={[
          "flex shrink-0 items-center justify-center",
          collapsed ? "h-5 w-5 rounded-md" : "h-6 w-6 rounded-[7px]",
          active
            ? "bg-white text-black"
            : iconWrapperClassName ?? iconClassName ?? "text-white/90",
        ].join(" ")}
      >
        <Icon
          className={[
            collapsed ? "h-3.5 w-3.5" : "h-[15px] w-[15px]",
            !active && iconClassName ? iconClassName : "",
          ].join(" ")}
          strokeWidth={2.2}
        />
      </span>
      {!collapsed ? <span className="truncate">{label}</span> : null}
      {!collapsed && trailing ? <span className="ml-auto">{trailing}</span> : null}
    </button>
  );
}

export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  onQuickAddNode,
}: AppSidebarProps) {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  return (
    <aside
      className={[
        "relative flex h-full min-h-screen w-full min-w-0 flex-col bg-black py-5 text-white xl:sticky xl:top-0 xl:h-screen xl:min-h-0 xl:overflow-hidden",
        collapsed ? "px-1.5" : "px-3",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-11 items-center text-zinc-400",
          collapsed ? "justify-center px-0" : "justify-start px-4",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelsTopLeft className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      <nav className="mt-5 space-y-1.5">
        {primaryItems.map(({ label, icon, active }) => (
          <SidebarButton
            key={label}
            collapsed={collapsed}
            label={label}
            icon={icon}
            active={active}
            iconWrapperClassName={
              label === "Train Lora"
                ? "bg-[radial-gradient(circle_at_30%_30%,#ffd95c_0%,#ff725c_38%,#7a5cff_68%,#2dc2ff_100%)] text-white"
                : label === "Node Editor"
                  ? "bg-[#1e88ff] text-white"
                  : label === "Assets"
                    ? "bg-transparent text-[#83d3ff]"
                    : undefined
            }
            iconClassName={
              label === "Assets"
                ? "h-4 w-4 text-[#83d3ff]"
                : undefined
            }
          />
        ))}
      </nav>

      <div className={collapsed ? "mt-8" : "mt-10"}>
        {!collapsed ? (
          <div className="px-4 text-[13px] font-medium tracking-[-0.02em] text-zinc-500">
            Quick Access
          </div>
        ) : null}

        <div className={collapsed ? "mt-2 space-y-1.5" : "mt-4 grid grid-cols-2 gap-2"}>
          {quickAccessItems.map(({ label, icon: Icon, accent, kind }) => (
            <button
              key={label}
              type="button"
              onClick={() => onQuickAddNode?.(kind)}
              className={[
                "transition-colors hover:bg-white/[0.05]",
                collapsed
                  ? "flex h-10 w-full items-center justify-center rounded-xl"
                  : "flex items-center gap-2 rounded-[16px] border border-white/[0.05] bg-[#111111] px-3 py-3 text-left",
              ].join(" ")}
              title={collapsed ? `${label} node` : undefined}
            >
              <span
                className={[
                  "flex shrink-0 items-center justify-center text-white",
                  collapsed ? `h-6 w-6 rounded-[7px] ${accent}` : `h-7 w-7 rounded-xl ${accent}`,
                ].join(" ")}
              >
                <Icon
                  className={collapsed ? "h-3.5 w-3.5" : "h-4 w-4"}
                  strokeWidth={2.1}
                />
              </span>
              {!collapsed ? (
                <span className="text-[13px] font-semibold tracking-[-0.03em] text-zinc-100">
                  {label}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className={collapsed ? "mt-10" : "mt-14"}>
        {!collapsed ? (
          <div className="px-4 text-[13px] font-medium tracking-[-0.02em] text-zinc-500">Tools</div>
        ) : null}

        <div className="mt-4 space-y-1.5">
          {toolItems.map(({ label, icon, accent }) => (
            <SidebarButton
              key={label}
              collapsed={collapsed}
              label={label}
              icon={icon}
              iconWrapperClassName={`${accent} text-white`}
            />
          ))}

          {!collapsed ? (
            <button
              className="flex h-11 w-full items-center gap-3 rounded-[14px] bg-[linear-gradient(90deg,#d6e5ff_0%,#8fc2ff_38%,#3267ff_100%)] px-4 text-left text-[15px] font-medium tracking-[-0.028em] text-[#27478a] shadow-[0_10px_24px_rgba(49,102,255,0.22)] transition-colors"
              title="Upgrade"
            >
              <span className="truncate">Upgrade</span>
            </button>
          ) : null}
        </div>
      </div>

      {!collapsed ? <div className="mt-14 px-4 text-[13px] font-medium tracking-[-0.02em] text-zinc-500">Sessions</div> : null}

      {!collapsed ? (
        <div className="mt-auto mb-16 rounded-[20px] bg-[#0c0c0c] px-3 pb-3 pt-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] xl:mb-20">
          <div className="px-1 text-[15px] font-medium tracking-[-0.03em] text-zinc-100">
            Earn 3,000 Credits
          </div>
          <button className="mt-3 h-10 w-full rounded-[12px] bg-[linear-gradient(90deg,#d6e5ff_0%,#8fc2ff_38%,#3267ff_100%)] px-4 text-left text-[15px] font-medium tracking-[-0.03em] text-[#27478a] shadow-[0_10px_24px_rgba(49,102,255,0.32)]">
            Upgrade
          </button>
        </div>
      ) : <div className="mt-auto" />}

      {!collapsed && workspaceMenuOpen ? (
        <div className="absolute bottom-20 left-3 right-3 z-20 rounded-[22px] border border-white/[0.06] bg-[#1b1b1b] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
          <div className="pb-2 text-[13px] font-semibold tracking-[-0.02em] text-zinc-500">
            Workspaces
          </div>

          <button className="flex w-full items-center gap-3 rounded-[16px] px-2 py-3 text-left transition-colors hover:bg-white/[0.04]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#2a2a2a] text-[17px] font-medium text-zinc-100">
              D
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold tracking-[-0.03em] text-zinc-100">
                Default Workspace
              </span>
              <span className="block pt-0.5 text-[13px] text-zinc-500">Free</span>
            </span>
            <ChevronDown className="h-4 w-4 text-zinc-500" strokeWidth={1.9} />
          </button>

          <button className="mt-1 flex w-full items-center gap-3 rounded-[16px] px-2 py-3 text-left text-zinc-300 transition-colors hover:bg-white/[0.04]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-zinc-400">
              <CirclePlus className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="text-[15px] font-medium tracking-[-0.03em]">
              Add workspace
            </span>
          </button>

          <div className="my-2 h-px bg-white/[0.06]" />

          <div className="rounded-[18px] border border-white/[0.05] bg-[#101012] px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#12351e]">
                <span className="h-4 w-4 rounded-full border-2 border-[#2ad15f]" />
              </span>
              <div>
                <div className="text-[15px] font-semibold tracking-[-0.03em] text-zinc-100">
                  100 Credits remaining
                </div>
                <div className="text-[13px] text-zinc-500">100 per day</div>
              </div>
            </div>
          </div>

          <div className="my-2 h-px bg-white/[0.06]" />

          <div className="space-y-1">
            <button className="flex w-full items-center gap-3 rounded-[16px] px-2 py-2.5 text-left text-zinc-300 transition-colors hover:bg-white/[0.04]">
              <Sparkles className="h-4 w-4 text-zinc-500" strokeWidth={2} />
              <span className="text-[15px] font-medium tracking-[-0.03em]">
                Upgrade plan
              </span>
            </button>
            <button className="flex w-full items-center gap-3 rounded-[16px] px-2 py-2.5 text-left text-zinc-300 transition-colors hover:bg-white/[0.04]">
              <CircleDollarSign className="h-4 w-4 text-zinc-500" strokeWidth={2} />
              <span className="text-[15px] font-medium tracking-[-0.03em]">
                Buy credits
              </span>
            </button>
            <button className="flex w-full items-center gap-3 rounded-[16px] px-2 py-2.5 text-left text-zinc-300 transition-colors hover:bg-white/[0.04]">
              <Settings className="h-4 w-4 text-zinc-500" strokeWidth={2} />
              <span className="text-[15px] font-medium tracking-[-0.03em]">
                Settings
              </span>
            </button>
            <button className="flex w-full items-center gap-3 rounded-[16px] px-2 py-2.5 text-left text-zinc-300 transition-colors hover:bg-white/[0.04]">
              <BarChart3 className="h-4 w-4 text-zinc-500" strokeWidth={2} />
              <span className="text-[15px] font-medium tracking-[-0.03em]">
                Usage Statistics
              </span>
            </button>
          </div>

          <div className="my-2 h-px bg-white/[0.06]" />

          <button
            type="button"
            onClick={() => setWorkspaceMenuOpen(false)}
            className="flex w-full items-center gap-3 rounded-[16px] px-2 py-2.5 text-left text-zinc-300 transition-colors hover:bg-white/[0.04]"
          >
            <LogOut className="h-4 w-4 text-zinc-500" strokeWidth={2} />
            <span className="text-[15px] font-medium tracking-[-0.03em]">Log out</span>
          </button>
        </div>
      ) : null}

      {!collapsed ? (
        <button
          type="button"
          onClick={() => setWorkspaceMenuOpen((value) => !value)}
          className="mt-3 flex items-center gap-3 rounded-[16px] border border-white/[0.06] bg-[#1b1b1b] px-3 py-2 transition-colors hover:bg-[#222222]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.06] bg-[#232323] text-[17px] font-medium text-[#f0d2b4]">
            C
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-[15px] font-medium tracking-[-0.03em] text-zinc-100">
              convincingclassicda...
            </div>
            <div className="text-[14px] text-zinc-500">Free</div>
          </div>
          <span className="flex h-8 w-8 items-center justify-center text-zinc-500">
            <ChevronUp
              className={[
                "h-4 w-4 transition-transform",
                workspaceMenuOpen ? "rotate-0" : "rotate-180",
              ].join(" ")}
              strokeWidth={2}
            />
          </span>
        </button>
      ) : (
        <div className="mt-3 flex justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-[#1b1b1b] text-[14px] font-medium text-[#f0d2b4]">
            C
          </div>
        </div>
      )}
    </aside>
  );
}
