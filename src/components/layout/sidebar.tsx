"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  ChevronDown,
  ChevronUp,
  Check,
  FolderGit2,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { activeSemesterId, setActiveSemesterId, semesters } = useSemester();
  const [isPlannerOpen, setIsPlannerOpen] = useState(
    pathname.startsWith("/planner") || pathname === "/"
  );
  const [isSemesterMenuOpen, setIsSemesterMenuOpen] = useState(false);

  const activeSemester = semesters.find((s) => s.id === activeSemesterId) || semesters[0];

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Timetable", href: "/timetable", icon: CalendarDays },
    { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { label: "Subjects", href: "/subjects", icon: BookOpen },
    { label: "Tasks & Assignments", href: "/tasks", icon: CheckSquare },
    { label: "Labs & Practicals", href: "/labs", icon: FlaskConical },
    { label: "Exams & Grades", href: "/grades", icon: GraduationCap },
  ];

  const plannerSubItems = [
    { label: "Pomodoro", href: "/planner/pomodoro", icon: Clock },
    { label: "Goals", href: "/planner/goals", icon: Target },
    { label: "Revision", href: "/planner/revision", icon: RotateCcw },
    { label: "Study Sessions", href: "/planner/sessions", icon: History },
  ];

  const bottomNavItems = [
    { label: "Notes", href: "/notes", icon: FileText },
    { label: "AI Tutor", href: "/ai-tutor", icon: Sparkles },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-[#09090b] text-neutral-300 border-r border-neutral-800 flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="px-5 py-6 flex items-center justify-between border-b border-neutral-900/60">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-black text-sm tracking-tighter group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="font-bold text-lg text-white tracking-tight">SemesterOS</span>
          </Link>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
            v1.0
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)]">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                )}
              >
                <Icon className={cn("w-4 h-4", active ? "text-black" : "text-neutral-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Collapsible Study Planner */}
          <div>
            <button
              onClick={() => setIsPlannerOpen(!isPlannerOpen)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all",
                pathname.startsWith("/planner")
                  ? "text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span>Study Planner</span>
              </div>
              {isPlannerOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              )}
            </button>

            {isPlannerOpen && (
              <div className="pl-6 pr-1 py-1 space-y-1">
                {plannerSubItems.map((sub) => {
                  const active = pathname === sub.href;
                  const SubIcon = sub.icon;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      prefetch={true}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                        active
                          ? "bg-white text-black font-semibold shadow-sm"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                      )}
                    >
                      <SubIcon className={cn("w-3.5 h-3.5", active ? "text-black" : "text-neutral-400")} />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {bottomNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                )}
              >
                <Icon className={cn("w-4 h-4", active ? "text-black" : "text-neutral-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Semester Selector at Bottom */}
      <div className="p-3 border-t border-neutral-900 relative">
        <button
          onClick={() => setIsSemesterMenuOpen(!isSemesterMenuOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 text-left transition-colors"
        >
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
              <span>{activeSemester?.name || "Semester 1"}</span>
              {activeSemester?.isCurrent && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              {activeSemester?.academicYear || "2024 - 2025"}
            </div>
          </div>
          <ChevronUp
            className={cn(
              "w-4 h-4 text-neutral-400 transition-transform",
              isSemesterMenuOpen ? "rotate-180" : ""
            )}
          />
        </button>

        {/* Dropdown Menu for Semesters */}
        {isSemesterMenuOpen && (
          <div className="absolute bottom-16 left-3 right-3 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5 animate-slide-down">
            <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Switch Semester
            </div>
            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {semesters.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSemesterId(s.id);
                    setIsSemesterMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                    s.id === activeSemesterId
                      ? "bg-white text-black font-semibold"
                      : "text-neutral-300 hover:bg-neutral-800"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{s.name}</span>
                    {s.isCurrent && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-300">
                        Current
                      </span>
                    )}
                  </div>
                  {s.id === activeSemesterId && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
