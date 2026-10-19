import React from "react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background animate-fade-in">
      {/* Topbar Skeleton */}
      <div className="h-14 border-b border-border bg-card/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-48 bg-muted/60 rounded animate-pulse hidden sm:block" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-sm"
            >
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-7 w-16 bg-muted/80 rounded animate-pulse" />
              <div className="h-2 w-28 bg-muted/50 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted/60 rounded animate-pulse" />
            </div>
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted/40 animate-pulse border border-border/40"
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted/60 rounded animate-pulse" />
            </div>
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted/40 animate-pulse border border-border/40"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
