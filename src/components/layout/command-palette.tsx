"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  BookOpen,
  CheckSquare,
  FlaskConical,
  GraduationCap,
  Clock,
  Target,
  RotateCcw,
  History,
  FileText,
  Sparkles,
  Settings,
  X,
  ArrowRight,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";

export function CommandPalette() {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, semesters, setActiveSemesterId } = useSemester();
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isCommandPaletteOpen) {
      setQuery("");
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const quickLinks = [
    { label: "Overview Dashboard", href: "/", icon: LayoutDashboard, category: "Navigation" },
    { label: "Weekly Timetable", href: "/timetable", icon: CalendarDays, category: "Navigation" },
    { label: "Attendance Tracker", href: "/attendance", icon: ClipboardCheck, category: "Navigation" },
    { label: "Subjects & Syllabus", href: "/subjects", icon: BookOpen, category: "Navigation" },
    { label: "Tasks & Assignments", href: "/tasks", icon: CheckSquare, category: "Navigation" },
    { label: "Labs & Experiments", href: "/labs", icon: FlaskConical, category: "Navigation" },
    { label: "Exams & SGPA/CGPA", href: "/grades", icon: GraduationCap, category: "Navigation" },
    { label: "Pomodoro Focus Timer", href: "/planner/pomodoro", icon: Clock, category: "Planner" },
    { label: "Daily & Weekly Goals", href: "/planner/goals", icon: Target, category: "Planner" },
    { label: "Revision Queue (SM-2)", href: "/planner/revision", icon: RotateCcw, category: "Planner" },
    { label: "Study History", href: "/planner/sessions", icon: History, category: "Planner" },
    { label: "Notes & Formulas Vault", href: "/notes", icon: FileText, category: "Vault" },
    { label: "AI Study Tutor", href: "/ai-tutor", icon: Sparkles, category: "AI" },
    { label: "Settings & Backups", href: "/settings", icon: Settings, category: "Settings" },
  ];

  const filteredLinks = quickLinks.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setIsCommandPaletteOpen(false);
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 p-4 animate-fade-in">
      <div
        className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground mr-3" />
          <input
            type="text"
            placeholder="Type a command, subject, or jump to a section..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full py-3.5 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredLinks.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No matching pages or commands found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-muted text-foreground transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {item.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-muted/40 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Navigate with arrows or mouse</span>
          <span className="font-mono">ESC to close</span>
        </div>
      </div>
    </div>
  );
}
