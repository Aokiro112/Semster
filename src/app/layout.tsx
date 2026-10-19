import type { Metadata } from "next";
import "./globals.css";
import { SemesterProvider } from "@/context/semester-context";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "SemesterOS — A Personal Academic Operating System",
  description:
    "A modular, local-first academic operating system designed for engineering students to manage all 8 semesters from one unified dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground flex antialiased">
        <SemesterProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
            {children}
          </div>
          <CommandPalette />
          <Toaster position="bottom-right" richColors theme="system" />
        </SemesterProvider>
      </body>
    </html>
  );
}
