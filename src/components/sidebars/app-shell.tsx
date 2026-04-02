"use client";

import { useState } from "react";
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
 * Shell layout with a resizable sidebar column driven by sidebar collapse state.
 * @param props - React children rendered beside the sidebar.
 * @returns Grid layout wrapping sidebar and main content.
 */
export function AppShell({ children, onQuickAddNode, rightSidebar }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const gridColumns = rightSidebar
    ? "xl:grid-cols-[var(--sidebar-col)_minmax(0,1fr)_360px]"
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
      {rightSidebar ? <div className="hidden min-w-0 xl:block xl:h-screen">{rightSidebar}</div> : null}
    </div>
  );
}
