"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface SemesterInfo {
  id: number;
  name: string;
  academicYear: string;
  isCurrent: boolean;
  sgpa: number;
  credits: number;
}

export interface ProfileInfo {
  name: string;
  degree: string;
  institution: string;
  rollNumber: string;
  targetCgpa: number;
  currentCgpa: number;
}

interface SemesterContextType {
  activeSemesterId: number;
  setActiveSemesterId: (id: number) => void;
  semesters: SemesterInfo[];
  setSemesters: React.Dispatch<React.SetStateAction<SemesterInfo[]>>;
  profile: ProfileInfo;
  setProfile: React.Dispatch<React.SetStateAction<ProfileInfo>>;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  refreshData: () => Promise<void>;
}

const defaultProfile: ProfileInfo = {
  name: "Alex Mercer",
  degree: "B.Tech Computer Science & Engineering",
  institution: "National Institute of Technology",
  rollNumber: "24CS1042",
  targetCgpa: 8.5,
  currentCgpa: 7.8,
};

const defaultSemesters: SemesterInfo[] = [
  { id: 1, name: "Semester 1", academicYear: "2024 - 2025", isCurrent: true, sgpa: 7.8, credits: 20 },
  { id: 2, name: "Semester 2", academicYear: "2024 - 2025", isCurrent: false, sgpa: 8.1, credits: 21 },
  { id: 3, name: "Semester 3", academicYear: "2025 - 2026", isCurrent: false, sgpa: 0.0, credits: 22 },
  { id: 4, name: "Semester 4", academicYear: "2025 - 2026", isCurrent: false, sgpa: 0.0, credits: 22 },
  { id: 5, name: "Semester 5", academicYear: "2026 - 2027", isCurrent: false, sgpa: 0.0, credits: 20 },
  { id: 6, name: "Semester 6", academicYear: "2026 - 2027", isCurrent: false, sgpa: 0.0, credits: 20 },
  { id: 7, name: "Semester 7", academicYear: "2027 - 2028", isCurrent: false, sgpa: 0.0, credits: 18 },
  { id: 8, name: "Semester 8", academicYear: "2027 - 2028", isCurrent: false, sgpa: 0.0, credits: 16 },
];

const SemesterContext = createContext<SemesterContextType | undefined>(undefined);

export function SemesterProvider({ children }: { children: React.ReactNode }) {
  const [activeSemesterId, setActiveSemesterIdState] = useState<number>(1);
  const [semesters, setSemesters] = useState<SemesterInfo[]>(defaultSemesters);
  const [profile, setProfile] = useState<ProfileInfo>(defaultProfile);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Load persisted semester choice
    const savedSem = localStorage.getItem("semesteros_active_sem");
    if (savedSem) {
      const parsed = parseInt(savedSem, 10);
      if (parsed >= 1 && parsed <= 8) {
        setActiveSemesterIdState(parsed);
      }
    }

    // Load theme
    const savedTheme = localStorage.getItem("semesteros_theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    // Keyboard shortcut for Cmd+K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const setActiveSemesterId = (id: number) => {
    setActiveSemesterIdState(id);
    localStorage.setItem("semesteros_active_sem", id.toString());
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("semesteros_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const refreshData = async () => {
    try {
      const res = await fetch("/api/semesters");
      if (res.ok) {
        const data = await res.json();
        if (data.semesters) setSemesters(data.semesters);
        if (data.profile) setProfile(data.profile);
      }
    } catch {
      // Ignore background refresh errors
    }
  };

  return (
    <SemesterContext.Provider
      value={{
        activeSemesterId,
        setActiveSemesterId,
        semesters,
        setSemesters,
        profile,
        setProfile,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        theme,
        toggleTheme,
        refreshData,
      }}
    >
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  const context = useContext(SemesterContext);
  if (!context) {
    throw new Error("useSemester must be used within a SemesterProvider");
  }
  return context;
}
