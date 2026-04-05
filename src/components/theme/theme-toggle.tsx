"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={[
        "flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-secondary)] shadow-[var(--shadow-panel)] backdrop-blur-xl transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]",
        className,
      ].join(" ")}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
    >
      {isLight ? (
        <MoonStar className="h-4 w-4" strokeWidth={2.1} />
      ) : (
        <SunMedium className="h-4 w-4" strokeWidth={2.1} />
      )}
    </button>
  );
}
