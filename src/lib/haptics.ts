/**
 * Haptic + audio feedback utilities for achievement completions.
 *
 * Vibration:  Web Vibration API — works on Android; iOS Safari silently ignores it.
 * Sound:      Real disc-hitting-chains recording served from /public/chains-hit.mp3
 */

// Module-level cache so the file is only fetched once
let _chainsAudio: HTMLAudioElement | null = null;

function getChainsAudio(): HTMLAudioElement {
  if (!_chainsAudio) {
    _chainsAudio = new Audio("/chains-hit.mp3");
    _chainsAudio.preload = "auto";
  }
  return _chainsAudio;
}

/** Short satisfying vibration pattern on devices that support it. */
export function triggerHaptic(pattern: number | number[] = [60, 20, 30, 20, 20]): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Not supported — fail silently
  }
}

/**
 * Plays the real disc-hitting-chains sound effect.
 * The audio element is cached after the first call so subsequent plays are instant.
 * Calling this inside a user-gesture handler (onClick) satisfies iOS Safari's
 * autoplay policy — no unlocking step needed.
 */
export function playCompletionSound(): void {
  try {
    const audio = getChainsAudio();
    // Rewind so rapid successive completions each play from the start
    audio.currentTime = 0;
    audio.volume = 0.85;
    audio.play().catch(() => {
      // Autoplay blocked (e.g. tab not yet focused) — fail silently
    });
  } catch {
    // Not supported — fail silently
  }
}
