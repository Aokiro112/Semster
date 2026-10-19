/**
 * Safe client-side wrapper for canvas-confetti to prevent SSR webpack bundling issues.
 */
export async function triggerConfetti(options?: {
  particleCount?: number;
  spread?: number;
  origin?: { y: number };
  colors?: string[];
}) {
  if (typeof window === "undefined") return;
  try {
    const confettiModule = await import("canvas-confetti");
    const confetti = confettiModule.default || confettiModule;
    if (typeof confetti === "function") {
      confetti({
        particleCount: options?.particleCount ?? 50,
        spread: options?.spread ?? 60,
        origin: options?.origin ?? { y: 0.8 },
        colors: options?.colors ?? ["#000000", "#71717a", "#ffffff"],
      });
    }
  } catch (err) {
    console.warn("Could not trigger confetti:", err);
  }
}
