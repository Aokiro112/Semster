"use client";

import React from "react";
import { Search, Sun, Moon, Bell } from "lucide-react";
import { useSemester } from "@/context/semester-context";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { profile, setIsCommandPaletteOpen, theme, toggleTheme } = useSemester();

  const formattedToday = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      <div>
        {title && <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>}
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* Global Search Button */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground text-xs font-medium transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search anything...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-background border border-border rounded text-muted-foreground">
            Ctrl K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* User Profile Avatar */}
        <div
          title={`${profile.name} • ${profile.degree}`}
          className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold font-mono tracking-wider shadow-sm cursor-pointer hover:opacity-90"
        >
          {profile.name.charAt(0)}
        </div>
      </div>
    </header>
  );
}
