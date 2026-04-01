"use client";

import { useState } from "react";
import { AppSidebar } from "./app-sidebar";

const SIDEBAR_EXPANDED_COL = "272px";
const SIDEBAR_COLLAPSED_COL = "44px";

type AppShellProps = {
  children: React.ReactNode;
};

/**
 * Shell layout with a resizable sidebar column driven by sidebar collapse state.
 * @param props - React children rendered beside the sidebar.
 * @returns Grid layout wrapping sidebar and main content.
 */
export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="grid min-h-screen grid-cols-1 xl:h-screen xl:grid-cols-[var(--sidebar-col)_minmax(0,1fr)] xl:overflow-hidden xl:transition-[grid-template-columns] xl:duration-300"
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
        />
      </div>
      <div className="min-w-0 xl:h-screen xl:overflow-y-auto">{children}</div>
    </div>
  );
}
