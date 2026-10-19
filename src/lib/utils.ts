import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(timeStr: string): string {
  // E.g. "08:30" -> "08:30 AM"
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const formattedHours = h % 12 || 12;
  const formattedMins = m.toString().padStart(2, "0");
  return `${formattedHours}:${formattedMins} ${period}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
