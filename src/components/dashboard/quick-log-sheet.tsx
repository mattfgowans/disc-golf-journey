"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Search } from "lucide-react";
import type { Achievement, Achievements } from "@/lib/useAchievements";

const RECENT_KEY = "dgj_recent_achievements";
const RECENT_MAX = 8;
const TOAST_THROTTLE_MS = 700;
const TOAST_DURATION_MS = 1200;

type CategoryKey = keyof Achievements;

type FlatAchievement = Achievement & { category: CategoryKey };

function flattenAchievements(achievements: Achievements): FlatAchievement[] {
  const flat: FlatAchievement[] = [];
  for (const category of ["skill", "social", "collection"] as const) {
    const list = achievements[category] ?? [];
    for (const a of list) {
      flat.push({ ...a, category });
    }
  }
  return flat;
}

function getRecent(): { category: CategoryKey; id: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { category: CategoryKey; id: string }[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pushRecent(category: CategoryKey, id: string) {
  const prev = getRecent();
  const next = [{ category, id }, ...prev.filter((r) => !(r.category === category && r.id === id))].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function isToggle(a: Achievement): a is Achievement & { kind?: "toggle" } {
  return a.kind !== "counter";
}

function isCounter(a: Achievement): a is Achievement & { kind: "counter"; progress: number; target: number } {
  return a.kind === "counter";
}

export function QuickLogSheet({
  open,
  onOpenChange,
  achievements,
  onToggle,
  onIncrement,
  defaultCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievements: Achievements;
  onToggle: (category: CategoryKey, id: string) => void;
  onIncrement: (category: CategoryKey, id: string, amount?: number) => void;
  defaultCategory: CategoryKey;
}) {
  const [search, setSearch] = useState("");
  const [recentSnapshot, setRecentSnapshot] = useState<{ category: CategoryKey; id: string }[]>(() => getRecent());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const lastToastAt = useRef<Map<string, number>>(new Map());
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((key: string, message: string) => {
    const now = Date.now();
    if (now - (lastToastAt.current.get(key) ?? 0) < TOAST_THROTTLE_MS) return;
    lastToastAt.current.set(key, now);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    if (open) {
      setRecentSnapshot(getRecent());
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const flat = useMemo(() => flattenAchievements(achievements), [achievements]);
  const byKey = useMemo(() => {
    const m = new Map<string, FlatAchievement>();
    for (const a of flat) m.set(`${a.category}:${a.id}`, a);
    return m;
  }, [flat]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return flat;
    return flat.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q)
    );
  }, [flat, search]);

  const recentAchievements = useMemo(() => {
    return recentSnapshot
      .map((r) => byKey.get(`${r.category}:${r.id}`))
      .filter((a): a is FlatAchievement => a != null);
  }, [recentSnapshot, byKey]);

  const showRecent = !search.trim() && recentAchievements.length > 0;
  const recentKeySet = useMemo(
    () => new Set(recentSnapshot.map((r) => `${r.category}:${r.id}`)),
    [recentSnapshot]
  );
  const filteredWithoutRecent = useMemo(
    () =>
      showRecent
        ? filtered.filter((a) => !recentKeySet.has(`${a.category}:${a.id}`))
        : filtered,
    [showRecent, filtered, recentKeySet]
  );
  const mainList = showRecent ? filteredWithoutRecent : filtered;

  const handleToggle = useCallback(
    (category: CategoryKey, id: string) => {
      const a = byKey.get(`${category}:${id}`);
      if (a) {
        showToast(`${category}:${id}`, `${a.isCompleted ? "Undone" : "Logged"}: ${a.title}`);
      }
      onToggle(category, id);
      pushRecent(category, id);
    },
    [onToggle, byKey, showToast]
  );

  const handleIncrement = useCallback(
    (category: CategoryKey, id: string, delta: number) => {
      const a = byKey.get(`${category}:${id}`);
      if (a && isCounter(a)) {
        const next = Math.min(a.target, Math.max(0, a.progress + delta));
        showToast(`${category}:${id}`, `Progress: ${a.title} (${next}/${a.target})`);
      }
      onIncrement(category, id, delta);
      pushRecent(category, id);
    },
    [onIncrement, byKey, showToast]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="left-1/2 top-auto right-auto bottom-0 -translate-x-1/2 translate-y-0 max-h-[85vh] w-full max-w-[calc(100%-0px)] rounded-t-2xl rounded-b-none border-b-0 p-0 gap-0"
        onPointerDownOutside={(e) => onOpenChange(false)}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Quick Log</DialogTitle>
        </DialogHeader>
        <div className="sticky top-0 z-10 bg-background border-b px-3 pt-4 pb-3 rounded-t-2xl">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search achievements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(85vh-60px)] px-3 py-2">
          {showRecent && (
            <>
              <p className="text-xs text-muted-foreground font-medium px-1 pb-1.5 pt-1">
                Recent
              </p>
              <ul className="space-y-1">
                {recentAchievements.map((a) => (
                  <li
                    key={`${a.category}:${a.id}`}
                    className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 min-h-[44px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      {a.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {a.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      {isToggle(a) && (
                        <Button
                          size="sm"
                          variant={a.isCompleted ? "outline" : "default"}
                          className="h-8 text-xs"
                          onClick={() => handleToggle(a.category, a.id)}
                        >
                          {a.isCompleted ? "Undo" : "Log"}
                        </Button>
                      )}
                      {isCounter(a) && (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 shrink-0"
                            disabled={a.progress <= 0}
                            onClick={() => handleIncrement(a.category, a.id, -1)}
                            aria-label="Decrease"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-xs tabular-nums min-w-[3rem] text-center">
                            {a.progress}/{a.target}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 shrink-0"
                            disabled={a.progress >= a.target}
                            onClick={() => handleIncrement(a.category, a.id, 1)}
                            aria-label="Increase"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground font-medium px-1 pb-1.5 pt-3">
                All achievements
              </p>
            </>
          )}
          {mainList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {search.trim() ? "No achievements match your search." : "Log an achievement to see it here."}
            </p>
          ) : (
            <ul className="space-y-1">
              {mainList.map((a) => (
                <li
                  key={`${a.category}:${a.id}`}
                  className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 min-h-[44px]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    {a.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {a.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {isToggle(a) && (
                      <Button
                        size="sm"
                        variant={a.isCompleted ? "outline" : "default"}
                        className="h-8 text-xs"
                        onClick={() => handleToggle(a.category, a.id)}
                      >
                        {a.isCompleted ? "Undo" : "Log"}
                      </Button>
                    )}
                    {isCounter(a) && (
                      <>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 shrink-0"
                          disabled={a.progress <= 0}
                          onClick={() => handleIncrement(a.category, a.id, -1)}
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-xs tabular-nums min-w-[3rem] text-center">
                          {a.progress}/{a.target}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 shrink-0"
                          disabled={a.progress >= a.target}
                          onClick={() => handleIncrement(a.category, a.id, 1)}
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
      {toastMessage && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-lg bg-foreground text-background text-sm shadow-lg animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
    </Dialog>
  );
}
