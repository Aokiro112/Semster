"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  User,
  GraduationCap,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Save,
  Check,
  CheckCircle2,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SettingsPage() {
  const { profile, setProfile, semesters, setSemesters, refreshData } = useSemester();
  const [activeTab, setActiveTab] = useState<"profile" | "semesters" | "policy" | "ai" | "data">(
    "profile"
  );

  // Form State: Profile
  const [name, setName] = useState(profile.name);
  const [degree, setDegree] = useState(profile.degree);
  const [institution, setInstitution] = useState(profile.institution);
  const [rollNumber, setRollNumber] = useState(profile.rollNumber);
  const [targetCgpa, setTargetCgpa] = useState(profile.targetCgpa.toString());

  // Form State: Policy & AI
  const [threshold, setThreshold] = useState("75");
  const [countCancelled, setCountCancelled] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.1:latest");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setName(data.profile.name);
          setDegree(data.profile.degree);
          setInstitution(data.profile.institution);
          setRollNumber(data.profile.rollNumber);
          setTargetCgpa(data.profile.targetCgpa.toString());
        }
        if (data.settings) {
          setThreshold(data.settings.attendanceThreshold.toString());
          setCountCancelled(data.settings.countCancelledAsConducted);
          setOllamaUrl(data.settings.ollamaUrl);
          setOllamaModel(data.settings.ollamaModel);
        }
      });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PROFILE",
          name,
          degree,
          institution,
          rollNumber,
          targetCgpa: parseFloat(targetCgpa),
        }),
      });

      if (res.ok) {
        toast.success("Academic profile saved!");
        setProfile((prev) => ({
          ...prev,
          name,
          degree,
          institution,
          rollNumber,
          targetCgpa: parseFloat(targetCgpa),
        }));
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SETTINGS",
          attendanceThreshold: parseFloat(threshold),
          countCancelledAsConducted: countCancelled,
          ollamaUrl,
          ollamaModel,
        }),
      });

      if (res.ok) {
        toast.success("Academic policies & AI settings saved!");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EXPORT_DATA" }),
      });

      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `semesteros-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Database exported successfully!");
      }
    } catch {
      toast.error("Failed to export database");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Settings"
        subtitle="Manage student profile, semester taxonomy, attendance policies, and local database backups"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/40 w-fit text-xs font-medium">
          <button
            onClick={() => setActiveTab("profile")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors",
              activeTab === "profile"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Academic Profile
          </button>
          <button
            onClick={() => setActiveTab("semesters")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors",
              activeTab === "semesters"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            8 Semesters
          </button>
          <button
            onClick={() => setActiveTab("policy")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors",
              activeTab === "policy"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Policy & Grading
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors",
              activeTab === "ai"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Local AI Config
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors",
              activeTab === "data"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Data & Backups
          </button>
        </div>

        {/* Tab: Academic Profile */}
        {activeTab === "profile" && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-foreground">Student Profile</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your personal engineering identity across transcripts, lab records, and dashboard
                metrics.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs max-w-xl">
              <div>
                <label className="block font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Degree & Major</label>
                <input
                  type="text"
                  required
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">Institution</label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1">Roll / Student ID</label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Target CGPA Goal</label>
                <input
                  type="number"
                  step="0.1"
                  min="4.0"
                  max="10.0"
                  required
                  value={targetCgpa}
                  onChange={(e) => setTargetCgpa(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
              >
                {saving ? "Saving..." : "Save Profile Changes"}
              </button>
            </form>
          </div>
        )}

        {/* Tab: Semesters */}
        {activeTab === "semesters" && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-foreground">8 Semesters Architecture</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage all 8 terms of your degree program with isolated subjects, schedules, and
                grades.
              </p>
            </div>

            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {semesters.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 flex items-center justify-between hover:bg-muted/10 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-mono font-bold text-[11px]">
                      {s.id}
                    </span>
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{s.name}</span>
                        {s.isCurrent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-foreground text-background">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {s.academicYear}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-muted-foreground">{s.credits} Credits</span>
                    <span className="font-bold text-foreground">
                      {s.sgpa > 0 ? `SGPA: ${s.sgpa.toFixed(1)}` : "Not graded"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Policy & Grading */}
        {activeTab === "policy" && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-foreground">Academic Policies & Grading Rules</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your university attendance compliance rules and 10-point GPA scale.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs max-w-xl">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Minimum Attendance Threshold (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground font-mono font-bold"
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Students falling below this threshold will receive automated bunk warnings.
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="cancelled"
                  checked={countCancelled}
                  onChange={(e) => setCountCancelled(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="cancelled" className="font-medium text-foreground cursor-pointer">
                  Count cancelled classes as conducted in denominator
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
              >
                {saving ? "Saving..." : "Update Policies"}
              </button>
            </form>
          </div>
        )}

        {/* Tab: Local AI Config */}
        {activeTab === "ai" && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-foreground">Local AI Tutor (Ollama)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect your local Ollama server running Llama 3.1, Qwen 2.5, or Mistral.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs max-w-xl">
              <div>
                <label className="block font-medium text-foreground mb-1">Ollama Server URL</label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Default Model Name</label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
              >
                {saving ? "Saving..." : "Save AI Configuration"}
              </button>
            </form>
          </div>
        )}

        {/* Tab: Data & Backups */}
        {activeTab === "data" && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-foreground">Data Sovereignty & Backups</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                SemesterOS stores everything locally in SQLite. Export your complete degree record as
                portable JSON anytime.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-foreground">Full Database Export</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Downloads an encrypted/structured JSON containing all subjects, attendance, marks,
                  notes, and lab records.
                </p>
              </div>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
