"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface TokenConfig {
  id: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  delay: number;
  arcOffsetX: number;
  variant: "points" | "rank";
}

interface GhostBadge {
  variant: "points" | "rank";
  x: number;
  y: number;
}

interface XpTokenPortalProps {
  /** The bounding rect of the button that was tapped. Always non-null when mounted. */
  origin: DOMRect | null;
}

const TOKENS_PER_TARGET = 4;
const TOKEN_SIZE = 28;
const STAGGER = 0.065;
const GHOST_W = 90;
const GHOST_H = 34;

/** True if the element's centre is within the scrollable viewport (below the navbar). */
function isVisible(el: HTMLElement, navBottom: number): boolean {
  const r = el.getBoundingClientRect();
  const cy = r.top + r.height / 2;
  return cy >= navBottom && cy <= window.innerHeight;
}

export function XpTokenPortal({ origin }: XpTokenPortalProps) {
  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [ghosts, setGhosts] = useState<GhostBadge[]>([]);

  // Spawn tokens once on mount — the parent uses `key={fireCount}` to remount
  // on every completion, so this effect always fires exactly once per burst.
  useEffect(() => {
    if (!origin) return;

    const navEl = document.getElementById("dg-navbar");
    const navBottom = navEl ? navEl.getBoundingClientRect().bottom : 60;
    const sw = window.innerWidth;

    // Ghost badge positions — just below the navbar
    const rankGhostX = sw * 0.25;
    const rankGhostY = navBottom + GHOST_H / 2 + 12;
    const pointsGhostX = sw * 0.72;
    const pointsGhostY = navBottom + GHOST_H / 2 + 12;

    const rankEl = document.getElementById("xp-rank-target");
    const pointsEl = document.getElementById("xp-total-target");

    const originX = origin.left + origin.width / 2;
    const originY = origin.top + origin.height / 2;

    type Target = { x: number; y: number; variant: "points" | "rank"; offScreen: boolean };
    const targets: Target[] = [];

    if (rankEl) {
      const onScreen = isVisible(rankEl, navBottom);
      const r = rankEl.getBoundingClientRect();
      targets.push({
        x: onScreen ? r.left + r.width / 2 : rankGhostX,
        y: onScreen ? r.top + r.height / 2 : rankGhostY,
        variant: "rank",
        offScreen: !onScreen,
      });
    }
    if (pointsEl) {
      const onScreen = isVisible(pointsEl, navBottom);
      const r = pointsEl.getBoundingClientRect();
      targets.push({
        x: onScreen ? r.left + r.width / 2 : pointsGhostX,
        y: onScreen ? r.top + r.height / 2 : pointsGhostY,
        variant: "points",
        offScreen: !onScreen,
      });
    }

    // Always fire tokens toward the points target at minimum, even if rank is absent
    if (targets.length === 0) return;

    const newGhosts: GhostBadge[] = targets
      .filter((t) => t.offScreen)
      .map((t) => ({ variant: t.variant, x: t.x, y: t.y }));
    setGhosts(newGhosts);

    // Interleaved round-robin: rank@0ms, points@65ms, rank@130ms …
    const newTokens: TokenConfig[] = [];
    for (let i = 0; i < TOKENS_PER_TARGET; i++) {
      for (const target of targets) {
        newTokens.push({
          id: Date.now() + newTokens.length,
          originX,
          originY,
          targetX: target.x,
          targetY: target.y,
          delay: newTokens.length * STAGGER,
          arcOffsetX: (Math.random() - 0.5) * 90,
          variant: target.variant,
        });
      }
    }

    setTokens(newTokens);

    const lastDelay = (newTokens.length - 1) * STAGGER;
    const tokenClearMs = (lastDelay + 0.85) * 1000 + 150;
    const t = setTimeout(() => setTokens([]), tokenClearMs);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dismiss ghost badges 1.5 s after they appear, independently of token lifecycle
  useEffect(() => {
    if (ghosts.length === 0) return;
    const t = setTimeout(() => setGhosts([]), 1500);
    return () => clearTimeout(t);
  }, [ghosts.length]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <AnimatePresence>
        {ghosts.map((ghost) => (
          <GhostBadgeEl key={ghost.variant} ghost={ghost} />
        ))}
      </AnimatePresence>

      {tokens.map((token) => (
        <XpToken key={token.id} {...token} />
      ))}
    </>,
    document.body
  );
}

function GhostBadgeEl({ ghost }: { ghost: GhostBadge }) {
  const isRank = ghost.variant === "rank";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -6 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      style={{
        position: "fixed",
        left: ghost.x - GHOST_W / 2,
        top: ghost.y - GHOST_H / 2,
        width: GHOST_W,
        height: GHOST_H,
        pointerEvents: "none",
        zIndex: 9998,
      }}
      className={
        isRank
          ? "flex items-center justify-center gap-1 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[12px] font-bold text-white shadow-lg shadow-violet-400/50"
          : "flex items-center justify-center gap-1 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[12px] font-bold text-white shadow-lg shadow-amber-300/50"
      }
    >
      <span>{isRank ? "⚡" : "⭐"}</span>
      <span>{isRank ? "Rank" : "XP"}</span>
    </motion.div>
  );
}

function XpToken({
  originX,
  originY,
  targetX,
  targetY,
  delay,
  arcOffsetX,
  variant,
}: Omit<TokenConfig, "id">) {
  const midX = (originX + targetX) / 2 + arcOffsetX;
  const midY = Math.min(originY, targetY) - 64;
  const o = -(TOKEN_SIZE / 2);

  return (
    <motion.div
      initial={{ x: originX + o, y: originY + o, scale: 0.3, opacity: 0 }}
      animate={{
        x: [originX + o, midX + o, targetX + o, targetX + o],
        y: [originY + o, midY + o, targetY + o, targetY + o],
        scale: [0.3, 1.4, 1, 0.2],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 0.78,
        delay,
        times: [0, 0.22, 0.82, 1],
        ease: "easeOut",
      }}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        pointerEvents: "none",
        zIndex: 9999,
        width: TOKEN_SIZE,
        height: TOKEN_SIZE,
      }}
      className={
        variant === "rank"
          ? "flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[11px] font-bold text-white shadow-md shadow-violet-400/60"
          : "flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-white shadow-md shadow-amber-300/60"
      }
    >
      {variant === "rank" ? "⚡" : "⭐"}
    </motion.div>
  );
}
