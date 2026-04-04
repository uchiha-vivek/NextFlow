"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton, useClerk, useUser } from "@clerk/nextjs";
import {
  Crop,
  FileImage,
  FileText,
  Folder,
  Home as HomeIcon,
  PanelsTopLeft,
  Sparkles,
  Video,
} from "lucide-react";
import type { WorkflowNodeKind } from "@/components/workflow/workflow-builder-context";

const primaryItems = [
  { label: "Home", icon: HomeIcon, href: "/home" },
  { label: "Train Lora", icon: Sparkles, href: "/home" },
  { label: "Node Editor", icon: PanelsTopLeft, href: "/workspace" },
  { label: "Assets", icon: Folder, href: "/home" },
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
  href?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconClassName?: string;
  iconWrapperClassName?: string;
  transparentActive?: boolean;
};

/**
 * Reusable sidebar action that can render as either a link or a plain button-shaped control.
 */
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
  const classes = [
    "flex w-full items-center text-left text-[15px] font-medium tracking-[-0.028em] transition-colors",
    collapsed ? "h-9 justify-center px-0 rounded-xl" : "h-10 gap-3 rounded-[14px] px-4",
    active
      ? transparentActive
        ? "bg-transparent text-white shadow-none"
        : "bg-[#2f2f2f] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      : "text-zinc-100 hover:bg-white/[0.04]",
  ].join(" ");

  const content = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        title={collapsed ? label : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={[
        classes,
      ].join(" ")}
      title={collapsed ? label : undefined}
    >
      {content}
    </button>
  );
}

/**
 * Main navigation and quick-add rail for the workflow workspace.
 */
export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  onQuickAddNode,
}: AppSidebarProps) {
  const clerk = useClerk();
  const { user } = useUser();
  const pathname = usePathname();
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "Signed in";

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
                  : href === "/home"
                    ? pathname.startsWith("/home")
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
              iconClassName={
                label === "Assets"
                  ? "h-4 w-4 text-[#83d3ff]"
                  : undefined
              }
            />
          ))}
        </nav>

        <div className="sidebar-scrollbar mt-10 min-h-0 flex-1 overflow-y-auto pr-1">
          {!collapsed ? (
            <div className="px-4 text-[13px] font-medium tracking-[-0.02em] text-zinc-500">
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
                  "w-full transition-colors hover:bg-white/[0.05]",
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
                  <Icon
                    className={collapsed ? "h-3.5 w-3.5" : "h-4 w-4"}
                    strokeWidth={2.1}
                  />
                </span>
                {!collapsed ? (
                  <span className="text-[14px] font-semibold tracking-[-0.03em] text-zinc-100">
                    {label}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <Show when="signed-out">
            {collapsed ? (
              <button
                type="button"
                onClick={() => clerk.openSignIn({ forceRedirectUrl: "/workspace" })}
                className="flex h-10 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-[#111111] text-[13px] font-medium text-zinc-100 transition-colors hover:bg-white/[0.05]"
                title="Sign in"
              >
                In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => clerk.openSignIn({ forceRedirectUrl: "/workspace" })}
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
              <div className="flex justify-center">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-8 w-8",
                    },
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-[16px] border border-white/[0.06] bg-[#111111] px-3 py-3">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-10 w-10",
                    },
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-medium tracking-[-0.03em] text-zinc-100">
                    {primaryEmail}
                  </div>
                  <div className="text-[13px] text-zinc-500">Signed in</div>
                </div>
              </div>
            )}
          </Show>
        </div>
      </div>
    </aside>
  );
}
