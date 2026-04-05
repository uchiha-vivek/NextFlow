"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, useClerk, useUser } from "@clerk/nextjs";
import {
  BarChart3,
  ChevronDown,
  ChevronsUpDown,
  CircleDollarSign,
  CreditCard,
  Crop,
  Folder,
  Home as HomeIcon,
  LogOut,
  PanelsTopLeft,
  Plus,
  Settings,
  Sparkles,
  UserCircle2,
  Users,
  Video,
  FileImage,
  FileText,
  MoonStar,
  BadgePercent,
  WalletCards,
  Code2,
  X,
} from "lucide-react";
import { ThemeToggle, } from "@/components/theme/theme-toggle";
import { useTheme } from "@/components/theme/theme-provider";
import type { WorkflowNodeKind } from "@/components/workflow/workflow-builder-context";

const primaryItems = [
  { label: "Home", icon: HomeIcon, href: "/app" },
  { label: "Train Lora", icon: Sparkles, href: "/app" },
  { label: "Node Editor", icon: PanelsTopLeft, href: "/workspace" },
  { label: "Assets", icon: Folder, href: "/app" },
] as const;

const quickAccessItems: Array<{
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
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

const settingsSections = [
  {
    title: "General",
    items: [
      { id: "overview", label: "Overview", icon: HomeIcon },
      { id: "profile", label: "Profile", icon: UserCircle2 },
      { id: "account", label: "Account", icon: CircleDollarSign },
      { id: "appearance", label: "Appearance", icon: MoonStar },
      { id: "promo", label: "Promo", icon: BadgePercent },
    ],
  },
  {
    title: "Workspace",
    items: [
      { id: "members", label: "Members", icon: Users },
      { id: "workspace-settings", label: "Settings", icon: Settings },
    ],
  },
  {
    title: "Billing",
    items: [
      { id: "compute-packs", label: "Compute Packs", icon: WalletCards },
      { id: "billing", label: "Billing", icon: CreditCard },
    ],
  },
  {
    title: "Developer",
    items: [{ id: "api-tokens", label: "API Tokens", icon: Code2 }],
  },
] as const;

type SettingsTabId =
  | "overview"
  | "profile"
  | "account"
  | "appearance"
  | "promo"
  | "members"
  | "workspace-settings"
  | "compute-packs"
  | "billing"
  | "api-tokens";

type AppSidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onQuickAddNode?: (kind: WorkflowNodeKind) => void;
};

type SidebarButtonProps = {
  collapsed: boolean;
  label: string;
  active?: boolean;
  trailing?: ReactNode;
  href?: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  iconClassName?: string;
  iconWrapperClassName?: string;
  transparentActive?: boolean;
};

function SidebarButton({
  collapsed,
  label,
  active,
  trailing,
  href,
  icon: Icon,
  iconClassName,
  iconWrapperClassName,
  transparentActive,
}: SidebarButtonProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const classes = [
    "flex w-full items-center text-left text-[15px] font-medium tracking-[-0.028em] transition-colors",
    collapsed ? "h-9 justify-center px-0 rounded-xl" : "h-10 gap-3 rounded-[14px] px-4",
    active
      ? transparentActive
        ? "bg-transparent text-[var(--text-primary)] shadow-none"
        : isLight
          ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
          : "bg-[#2f2f2f] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
  ].join(" ");

  const content = (
    <>
      <span
        className={[
          "flex shrink-0 items-center justify-center",
          collapsed ? "h-5 w-5 rounded-md" : "h-6 w-6 rounded-[7px]",
          active
            ? isLight
              ? "bg-[#171717] text-white"
              : "bg-white text-black"
            : iconWrapperClassName ?? iconClassName ?? "text-[var(--text-primary)]/90",
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
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} title={collapsed ? label : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} title={collapsed ? label : undefined}>
      {content}
    </button>
  );
}

function initialsFromName(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "N";
}

function SettingsModal({
  open,
  onClose,
  activeTab,
  onTabChange,
  workspaceName,
}: {
  open: boolean;
  onClose: () => void;
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
  workspaceName: string;
}) {
  if (!open) return null;

  const tabContent: Record<SettingsTabId, { title: string; description: string }> = {
    overview: {
      title: "Workspace Overview",
      description: "Switch workspaces, review your free compute balance, and manage your active plan from one place.",
    },
    profile: {
      title: "Profile",
      description: "Profile editing can plug into Clerk next. This screen is ready for your personal details and avatar preferences.",
    },
    account: {
      title: "Account",
      description: "Account-level billing, email preferences, and security controls can live here.",
    },
    appearance: {
      title: "Appearance",
      description: "Theme, density, and editor appearance settings can be configured here.",
    },
    promo: {
      title: "Promo",
      description: "Promotional codes and referral perks can be managed here.",
    },
    members: {
      title: "Members",
      description: "Invite collaborators, manage roles, and keep track of workspace access.",
    },
    "workspace-settings": {
      title: "Workspace Settings",
      description: "Rename the workspace, manage defaults, and configure project-wide behavior.",
    },
    "compute-packs": {
      title: "Compute Packs",
      description: "Track daily allowance and future one-time compute purchases from this section.",
    },
    billing: {
      title: "Billing",
      description: "Billing history, invoices, and payment methods can be surfaced here.",
    },
    "api-tokens": {
      title: "API Tokens",
      description: "Developer tokens and integration credentials can be managed from this area.",
    },
  };

  const current = tabContent[activeTab];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-5 py-5 backdrop-blur-md">
      <div className="relative flex h-[min(86vh,740px)] w-full max-w-[960px] overflow-hidden rounded-[24px] border border-white/10 bg-[#0f0f10] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="flex w-[215px] shrink-0 flex-col border-r border-white/6 bg-black px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            className="mb-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-white"
            aria-label="Close settings"
            title="Close settings"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
          <div className="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto pr-2">
            {settingsSections.map((section) => (
              <div key={section.title} className="mb-4">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.items.map(({ id, label, icon: Icon }) => {
                    const active = activeTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onTabChange(id)}
                        className={[
                          "flex w-full items-center gap-3 rounded-[14px] px-3 py-1.5 text-left transition-colors",
                          active
                            ? "bg-white/[0.08] text-white"
                            : "text-zinc-300 hover:bg-white/[0.04] hover:text-white",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={2.1} />
                        <span className="text-[14px] font-medium tracking-[-0.025em]">
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#111112] px-6 py-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Workspace
          </div>

          <div className="mt-3 rounded-[20px] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[13px] text-zinc-500">Active Workspace</div>
                <div className="mt-1.5 text-[18px] font-semibold tracking-[-0.04em] text-white">
                  {current.title}
                </div>
                <div className="mt-1.5 max-w-xl text-[13px] leading-5 text-zinc-400">
                  {current.description}
                </div>
              </div>
              <button className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left text-zinc-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold">
                  {initialsFromName(workspaceName)}
                </span>
                <span className="text-[15px] font-medium tracking-[-0.03em]">{workspaceName}</span>
                <ChevronDown className="h-4 w-4 text-zinc-500" strokeWidth={2.1} />
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-[20px] border border-white/8 bg-[#171717] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-[28px] font-medium text-white">
                  {initialsFromName(workspaceName).slice(0, 1)}
                </div>
                <div>
                  <div className="text-[18px] font-semibold tracking-[-0.04em] text-white">
                    {workspaceName}
                  </div>
                  <div className="mt-1.5 inline-flex rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-0.5 text-[12px] font-medium text-zinc-300">
                    Free
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-white/[0.06]">
                  Manage Workspace
                </button>
                <button className="rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-black transition-colors hover:bg-zinc-200">
                  Upgrade
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_210px]">
            <div className="rounded-[20px] border border-white/8 bg-[#171717] p-5">
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Free Compute
              </div>
              <div className="mt-2 text-[48px] leading-none font-semibold tracking-[-0.06em] text-white">72</div>
              <div className="mt-4 flex items-center justify-between text-[13px] text-zinc-400">
                <span>Daily Allowance</span>
                <span>72 / 100</span>
              </div>
              <div className="mt-2.5 h-3 rounded-full bg-white/[0.08]">
                <div className="h-full w-[72%] rounded-full bg-[#1567ff]" />
              </div>
            </div>

            <div className="rounded-[20px] border border-white/8 bg-[#171717] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  One-Time Compute
                </div>
                <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.06]">
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.1} />
                  Buy
                </button>
              </div>
              <div className="mt-2 text-[48px] leading-none font-semibold tracking-[-0.06em] text-white">0</div>
              <div className="mt-4 max-w-[14rem] text-[13px] leading-5 text-zinc-400">
                No compute packs purchased
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  onQuickAddNode,
}: AppSidebarProps) {
  const clerk = useClerk();
  const { user } = useUser();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTabId>("overview");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const workspaceName = useMemo(() => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return fullName || user?.username || "Default Workspace";
  }, [user?.firstName, user?.lastName, user?.username]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const openSettings = (tab: SettingsTabId) => {
    setActiveSettingsTab(tab);
    setSettingsOpen(true);
    setMenuOpen(false);
  };

  return (
    <>
      <aside
        className={[
          "relative flex h-full min-h-screen w-full min-w-0 flex-col bg-[var(--sidebar-bg)] py-5 text-[var(--text-primary)] xl:sticky xl:top-0 xl:h-screen xl:min-h-0 xl:overflow-hidden",
          collapsed ? "px-1.5" : "px-3",
        ].join(" ")}
      >
        <div
          className={[
            "flex h-11 items-center text-[var(--text-muted)]",
            collapsed ? "justify-center px-0" : "justify-start px-4",
          ].join(" ")}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelsTopLeft className="h-4 w-4" strokeWidth={1.8} />
            </button>
            {!collapsed ? <ThemeToggle className="h-8 w-8 rounded-lg shadow-none" /> : null}
          </div>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <nav className="space-y-0">
            {primaryItems.map(({ label, icon, href }) => (
              <SidebarButton
                key={label}
                collapsed={collapsed}
                label={label}
                icon={icon}
                href={href}
                active={
                  href === "/workspace"
                    ? pathname.startsWith("/workspace")
                    : href === "/app"
                      ? pathname.startsWith("/app") || pathname.startsWith("/home")
                      : false
                }
                transparentActive={label !== "Node Editor"}
                iconWrapperClassName={
                  label === "Train Lora"
                    ? "bg-[radial-gradient(circle_at_30%_30%,#ffd95c_0%,#ff725c_38%,#7a5cff_68%,#2dc2ff_100%)] text-white"
                    : label === "Node Editor"
                      ? "bg-[#1e88ff] text-white"
                      : label === "Assets"
                        ? "bg-transparent text-[#83d3ff]"
                        : undefined
                }
                iconClassName={label === "Assets" ? "h-4 w-4 text-[#83d3ff]" : undefined}
              />
            ))}
          </nav>

          <div className="sidebar-scrollbar mt-10 min-h-0 flex-1 overflow-y-auto pr-1">
            {!collapsed ? (
              <div className="px-4 text-[13px] font-medium tracking-[-0.02em] text-[var(--text-muted)]">
                Tools
              </div>
            ) : null}

            <div className={collapsed ? "mt-1 space-y-0" : "mt-1.5 space-y-0"}>
              {quickAccessItems.map(({ label, icon: Icon, accent, kind }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onQuickAddNode?.(kind)}
                  className={[
                    "w-full transition-colors hover:bg-[var(--surface-2)]",
                    collapsed
                      ? "flex h-9 items-center justify-center rounded-xl"
                      : "flex items-center gap-3 rounded-[16px] px-3 py-2 text-left",
                  ].join(" ")}
                  title={collapsed ? `${label} node` : undefined}
                >
                  <span
                    className={[
                      "flex shrink-0 items-center justify-center text-white",
                      collapsed ? `h-6 w-6 rounded-[7px] ${accent}` : `h-7 w-7 rounded-xl ${accent}`,
                    ].join(" ")}
                  >
                    <Icon className={collapsed ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.1} />
                  </span>
                  {!collapsed ? (
                    <span className="text-[14px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                      {label}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-4 border-t border-[color:var(--border-soft)] pt-4" ref={accountMenuRef}>
            <Show when="signed-out">
              {collapsed ? (
                <button
                  type="button"
                  onClick={() => clerk.openSignIn({ forceRedirectUrl: "/app" })}
                  className="flex h-10 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-[#111111] text-[13px] font-medium text-zinc-100 transition-colors hover:bg-white/[0.05]"
                  title="Sign in"
                >
                  In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => clerk.openSignIn({ forceRedirectUrl: "/app" })}
                  className="flex w-full items-center gap-3 rounded-[16px] border border-white/[0.06] bg-[#111111] px-3 py-3 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.06] bg-[#1b1b1b] text-sm font-semibold text-zinc-100">
                    @
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-medium tracking-[-0.03em] text-zinc-100">
                      Sign in
                    </div>
                    <div className="text-[13px] text-zinc-500">Access your workspace</div>
                  </div>
                </button>
              )}
            </Show>

            <Show when="signed-in">
              {collapsed ? (
                <button
                  type="button"
                  onClick={() => setMenuOpen((current) => !current)}
                  className="flex w-full justify-center"
                  title="Account menu"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#111111] text-sm font-semibold text-white">
                    {initialsFromName(workspaceName).slice(0, 1)}
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMenuOpen((current) => !current)}
                  className="flex w-full items-center gap-3 rounded-[18px] border border-white/[0.06] bg-[#111111] px-3 py-3 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.06] bg-[#1b1b1b] text-base font-semibold text-zinc-100">
                    {initialsFromName(workspaceName).slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-medium tracking-[-0.03em] text-zinc-100">
                      {workspaceName}
                    </div>
                    <div className="truncate text-[13px] text-zinc-500">Free</div>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={2.1} />
                </button>
              )}

              {menuOpen ? (
                <div
                  className={[
                    "absolute bottom-full z-40 mb-3 overflow-hidden rounded-[24px] border border-white/8 bg-[#1a1a1b] shadow-[0_30px_90px_rgba(0,0,0,0.48)]",
                    collapsed ? "left-0 w-[320px]" : "left-0 right-0",
                  ].join(" ")}
                >
                  <div className="border-b border-white/8 p-3">
                    <div className="text-sm font-semibold text-zinc-400">Workspaces</div>
                    <div className="mt-2 rounded-[18px] border border-white/8 bg-white/[0.03] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-white">
                          {initialsFromName(workspaceName).slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[15px] font-semibold tracking-[-0.03em] text-white">
                            {workspaceName}
                          </div>
                          <div className="text-sm text-zinc-500">Free</div>
                        </div>
                      </div>
                    </div>
                    <button className="mt-2 flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                        <Plus className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                      <span className="text-[15px] font-medium">Add workspace</span>
                    </button>
                    <div className="mt-2 rounded-[18px] border border-white/8 bg-black p-3">
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-5 w-5 items-center justify-center">
                          <span className="absolute h-4 w-4 rounded-full border-2 border-emerald-400/80 border-t-transparent animate-spin" />
                        </span>
                        <div>
                          <div className="text-[15px] font-semibold text-white">72 Credits remaining</div>
                          <div className="text-sm text-zinc-500">100 per day</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button className="flex w-full items-center gap-3 rounded-[16px] px-4 py-2.5 text-left text-zinc-200 transition-colors hover:bg-white/[0.04]">
                      <Sparkles className="h-4 w-4 text-zinc-400" strokeWidth={2.1} />
                      <span className="text-[15px] font-medium">Upgrade plan</span>
                    </button>
                    <button className="flex w-full items-center gap-3 rounded-[16px] px-4 py-2.5 text-left text-zinc-200 transition-colors hover:bg-white/[0.04]">
                      <CreditCard className="h-4 w-4 text-zinc-400" strokeWidth={2.1} />
                      <span className="text-[15px] font-medium">Buy credits</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openSettings("workspace-settings")}
                      className="flex w-full items-center gap-3 rounded-[16px] px-4 py-2.5 text-left text-zinc-200 transition-colors hover:bg-white/[0.04]"
                    >
                      <Settings className="h-4 w-4 text-zinc-400" strokeWidth={2.1} />
                      <span className="text-[15px] font-medium">Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openSettings("overview")}
                      className="flex w-full items-center gap-3 rounded-[16px] px-4 py-2.5 text-left text-zinc-200 transition-colors hover:bg-white/[0.04]"
                    >
                      <BarChart3 className="h-4 w-4 text-zinc-400" strokeWidth={2.1} />
                      <span className="text-[15px] font-medium">Usage Statistics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void clerk.signOut({ redirectUrl: "/" })}
                      className="flex w-full items-center gap-3 rounded-[16px] px-4 py-2.5 text-left text-zinc-200 transition-colors hover:bg-white/[0.04]"
                    >
                      <LogOut className="h-4 w-4 text-zinc-400" strokeWidth={2.1} />
                      <span className="text-[15px] font-medium">Log out</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </Show>
          </div>
        </div>
      </aside>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        activeTab={activeSettingsTab}
        onTabChange={setActiveSettingsTab}
        workspaceName={workspaceName}
      />
    </>
  );
}
