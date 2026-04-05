"use client";

import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import type { WorkflowNodeKind } from "@/components/workflow/workflow-builder-context";

const SIDEBAR_EXPANDED_COL = "272px";
const SIDEBAR_COLLAPSED_COL = "44px";

type AppShellProps = {
  children: React.ReactNode;
  onQuickAddNode?: (kind: WorkflowNodeKind) => void;
  rightSidebar?: React.ReactNode;
};

/**
 * Shell layout that coordinates the left navigation rail, main workspace, and optional history panel.
 */
export function AppShell({ children, onQuickAddNode, rightSidebar }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const gridColumns = rightSidebar
    ? historyCollapsed
      ? "xl:grid-cols-[var(--sidebar-col)_minmax(0,1fr)_56px]"
      : "xl:grid-cols-[var(--sidebar-col)_minmax(0,1fr)_360px]"
    : "xl:grid-cols-[var(--sidebar-col)_minmax(0,1fr)]";

  return (
    <div
      className={`grid min-h-screen grid-cols-1 xl:h-screen ${gridColumns} xl:overflow-hidden xl:transition-[grid-template-columns] xl:duration-300`}
      style={
        {
          "--sidebar-col": collapsed ? SIDEBAR_COLLAPSED_COL : SIDEBAR_EXPANDED_COL,
        } as React.CSSProperties
      }
    >
      <div className="min-w-0 xl:h-screen xl:border-r xl:border-white/[0.03]">
        <AppSidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          onQuickAddNode={onQuickAddNode}
        />
      </div>
      <div className="min-w-0 xl:h-screen xl:overflow-y-auto">{children}</div>
      {rightSidebar ? (
        <div className="hidden min-w-0 xl:block xl:h-screen xl:min-h-0">
          {historyCollapsed ? (
            <div className="flex h-full items-start justify-center border-l border-white/[0.04] bg-[#171717] px-2 py-4">
              <button
                type="button"
                onClick={() => setHistoryCollapsed(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Open workflow history"
                title="Open workflow history"
              >
                <PanelRightOpen className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="relative h-full min-h-0 overflow-hidden">
              <button
                type="button"
                onClick={() => setHistoryCollapsed(true)}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#101114]/90 text-zinc-300 shadow-[0_10px_25px_rgba(0,0,0,0.28)] transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Close workflow history"
                title="Close workflow history"
              >
                <PanelRightClose className="h-4 w-4" strokeWidth={2} />
              </button>
              {rightSidebar}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
