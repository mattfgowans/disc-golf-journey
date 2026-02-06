"use client";

import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./firebase-auth";
import { useUserDoc } from "./useUserDoc";
import { computePointTotals, getPeriodKeys } from "./points";
import { getCurrentYear, getEffectiveProgress, getResetPolicy, isUnlocked } from "./achievementProgress";

// Schema version for achievements - increment when template structure changes
const ACHIEVEMENTS_SCHEMA_VERSION = 1;

export type AchievementBase = {
  id: string;
  title: string;
  description: string;
  category: "skill" | "social" | "collection";
  subcategory?: string;
  isCompleted: boolean;
  completedDate?: Timestamp;
  points?: number;
  rarity?: "common" | "rare" | "epic" | "legendary";
  /** Default "yearly" when missing. */
  resetPolicy?: "never" | "yearly";
  /** Locked until this parent achievement is completed. */
  requiresId?: string;
  /** Set when writing yearly achievements; used to reset when year changes. */
  year?: number;
};

export type ToggleAchievement = AchievementBase & {
  kind?: "toggle"; // optional for backward compatibility
};

export type CounterAchievement = AchievementBase & {
  kind: "counter";
  target: number;
  progress: number;
};

export type Achievement = ToggleAchievement | CounterAchievement;

export type Achievements = {
  skill: Achievement[];
  social: Achievement[];
  collection: Achievement[];
};

// Helper function to determine if an achievement is complete
export function isAchievementComplete(achievement: Achievement): boolean {
  if (achievement.kind === "counter") {
    return achievement.progress >= achievement.target;
  }
  return achievement.isCompleted === true;
}

// Helper functions for Firestore sanitization
type AnyRecord = Record<string, any>;

function stripUndefined<T extends AnyRecord>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function sanitizeAchievementsForFirestore(a: Achievements) {
  const sanitizeList = (list: Achievement[]) =>
    list.map((ach) => stripUndefined(ach as AnyRecord));

  return {
    skill: sanitizeList(a.skill ?? []),
    social: sanitizeList(a.social ?? []),
    collection: sanitizeList(a.collection ?? []),
  };
}

const defaultAchievements: Achievements = {
  skill: [],
  social: [],
  collection: [],
};

// Helper function to merge saved achievements with template data
// Keeps template as source of truth for titles/points/order
// Applies effective progress (yearly reset when stored.year !== currentYear)
function mergeAchievementsWithTemplate(saved: Achievements, template: Achievements): Achievements {
  const categories: (keyof Achievements)[] = ["skill", "social", "collection"];
  const currentYear = getCurrentYear();

  const merged: Achievements = { skill: [], social: [], collection: [] };

  for (const category of categories) {
    merged[category] = template[category].map((templateAchievement) => {
      const savedAchievement = saved[category]?.find((a) => a.id === templateAchievement.id);
      const stored = savedAchievement
        ? {
            isCompleted: savedAchievement.isCompleted,
            completedDate: savedAchievement.completedDate,
            progress:
              templateAchievement.kind === "counter" && typeof (savedAchievement as any).progress === "number"
                ? (savedAchievement as any).progress
                : 0,
            year: (savedAchievement as any).year,
          }
        : null;

      const effective = getEffectiveProgress(templateAchievement, stored, currentYear);

      const mergedAchievement: Achievement = {
        ...templateAchievement,
        isCompleted: effective.isCompleted,
        completedDate: effective.completedDate,
      };

      if (templateAchievement.kind === "counter") {
        (mergedAchievement as CounterAchievement).progress = effective.progress;
      }

      return mergedAchievement;
    });
  }

  return merged;
}

export function useAchievements(initialAchievements?: Achievements) {
  const { user, loading: authLoading } = useAuth();
  const { userData, mergeUserData, loading: userDocLoading } = useUserDoc();
  const [achievements, setAchievements] = useState<Achievements>(
    initialAchievements || defaultAchievements
  );
  const [loading, setLoading] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([]);

  const prevUnlockedIdsRef = useRef<Set<string>>(new Set());
  const firstRunRef = useRef(true);

  // Debounced save refs
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAchievementsRef = useRef<Achievements | null>(null);
  const pendingContextRef = useRef<{ category: string; id: string } | undefined>(undefined);
  const pendingUidRef = useRef<string | null>(null);

  // Track which user we've last hydrated achievements for
  const lastHydratedUidRef = useRef<string | null>(null);

  // Suppress autosave when setting achievements from firestore or reset
  const suppressNextSaveRef = useRef(false);

  // Helper to set achievements from remote sources (firestore/reset) with temporary suppression
  function setAchievementsFromRemote(next: Achievements, reason: "firestore" | "reset") {
    suppressNextSaveRef.current = true;
    setAchievements(next);

    // Clear suppression on the next tick so it can't suppress user actions
    const clearSuppression = () => {
      suppressNextSaveRef.current = false;
    };

    // Use queueMicrotask if available, otherwise setTimeout
    if (typeof queueMicrotask !== "undefined") {
      queueMicrotask(clearSuppression);
    } else {
      setTimeout(clearSuppression, 0);
    }
  }

  // Track when auth state is resolved (user is either signed in or signed out)
  useEffect(() => {
    setAuthResolved(!authLoading);
  }, [authLoading]);

  // Save achievements to Firestore
  const saveAchievements = async (newAchievements: Achievements, context?: { category: string, id: string }) => {
    if (!user) return;

    // Prevent saves during hydration to avoid resetting points to 0
    if (loading) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[ACH][WRITE] saveAchievements skipped - still hydrating, uid: ${user.uid}`);
      }
      return;
    }

    // Safety check: Don't reset points to 0 if we have existing achievement data
    // This prevents nuking points when achievements haven't been properly merged yet
    const hasExistingAchievements = userData?.achievements && (
      (Array.isArray(userData.achievements.skill) && userData.achievements.skill.length > 0) ||
      (Array.isArray(userData.achievements.social) && userData.achievements.social.length > 0) ||
      (Array.isArray(userData.achievements.collection) && userData.achievements.collection.length > 0)
    );

    const allNewAchievements = [
      ...newAchievements.skill,
      ...newAchievements.social,
      ...newAchievements.collection,
    ];
    const newPointTotals = computePointTotals(allNewAchievements);

    // If new points would be 0 but we have existing achievements, skip the save
    const newPointsAreZero = newPointTotals.week === 0 && newPointTotals.month === 0 &&
                             newPointTotals.year === 0 && newPointTotals.allTime === 0;
    if (newPointsAreZero && hasExistingAchievements && !context) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[ACH][WRITE] saveAchievements skipped - would reset points to 0, uid: ${user.uid}`);
      }
      return;
    }

    // Detect existing points from Firestore
    const existingPoints = userData?.stats?.points;

    const hasExistingPoints =
      existingPoints &&
      (
        (existingPoints.week ?? 0) > 0 ||
        (existingPoints.month ?? 0) > 0 ||
        (existingPoints.year ?? 0) > 0 ||
        (existingPoints.allTime ?? 0) > 0
      );

    // If new points would be 0 but we already had points, skip the save
    if (newPointsAreZero && hasExistingPoints && !context) {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[ACH][WRITE] saveAchievements skipped - would reset existing points to 0`,
          {
            uid: user.uid,
            existingPoints,
            newPointTotals,
          }
        );
      }
      return;
    }

    try {
      if (process.env.NODE_ENV !== "production") {
        const progressSummary = Object.entries(newAchievements).map(([cat, achievements]) => {
          const withProgress = achievements.filter(a => a.kind === "counter" ? (a as CounterAchievement).progress > 0 : a.isCompleted).length;
          return `${cat}: ${withProgress}/${achievements.length}`;
        }).join(', ');
        console.log(`[ACH][WRITE] saveAchievements starting - uid: ${user.uid}, doc: users/${user.uid}, context: ${context ? `${context.category}/${context.id}` : 'none'}, progress: ${progressSummary}`);
      }

      // Use writeBatch for atomic updates
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Update user achievements
      const userDocRef = doc(db, "users", user.uid);

      // DEV-ONLY: Pre-flight check
      batch.set(userDocRef, {
        achievements: sanitizeAchievementsForFirestore(newAchievements),
        achievementsSchemaVersion: ACHIEVEMENTS_SCHEMA_VERSION,
        updatedAt: now,
      }, { merge: true });

      // Compute point totals and update stats
      const allAchievements = [
        ...newAchievements.skill,
        ...newAchievements.social,
        ...newAchievements.collection,
      ];
      const pointTotals = computePointTotals(allAchievements);
      const statsRef = doc(db, "users", user.uid, "stats", "points");
      batch.set(statsRef, {
        ...pointTotals,
        updatedAt: now,
      }, { merge: true });

      // Update leaderboard entries for all periods
      const periodKeys = getPeriodKeys();
      const resolvedUsername =
        (userData as any)?.profile?.username ??
        (userData as any)?.username ??
        (userData as any)?.profile?.profile?.username ??
        null;

      const resolvedDisplayName =
        (userData as any)?.profile?.displayName ??
        (userData as any)?.displayName ??
        (userData as any)?.profile?.profile?.displayName ??
        user.displayName ??
        "Anonymous";

      const resolvedPhotoURL =
        (userData as any)?.profile?.photoURL ??
        (userData as any)?.photoURL ??
        (userData as any)?.profile?.profile?.photoURL ??
        user.photoURL ??
        null;

      const userInfo = {
        displayName: resolvedDisplayName,
        username: resolvedUsername,
        photoURL: resolvedPhotoURL,
        updatedAt: now,
      };

      // Weekly leaderboard
      const weeklyEntryRef = doc(db, "leaderboards", periodKeys.weeklyKey, "entries", user.uid);
      batch.set(weeklyEntryRef, {
        ...userInfo,
        points: pointTotals.week,
      }, { merge: true });

      // Monthly leaderboard
      const monthlyEntryRef = doc(db, "leaderboards", periodKeys.monthlyKey, "entries", user.uid);
      batch.set(monthlyEntryRef, {
        ...userInfo,
        points: pointTotals.month,
      }, { merge: true });

      // Yearly leaderboard
      const yearlyEntryRef = doc(db, "leaderboards", periodKeys.yearlyKey, "entries", user.uid);
      batch.set(yearlyEntryRef, {
        ...userInfo,
        points: pointTotals.year,
      }, { merge: true });

      // All-time leaderboard
      const allTimeEntryRef = doc(db, "leaderboards", "allTime", "entries", user.uid);
      batch.set(allTimeEntryRef, {
        ...userInfo,
        points: pointTotals.allTime,
      }, { merge: true });


      // Commit all writes atomically
      await batch.commit();

      if (process.env.NODE_ENV !== "production") {
        console.log(`[ACH][WRITE] saveAchievements SUCCESS - uid: ${user.uid}, context: ${context ? `${context.category}/${context.id}` : 'none'}`);
      }
      // Update shared userData state locally
      mergeUserData({
        achievements: sanitizeAchievementsForFirestore(newAchievements),
        achievementsSchemaVersion: ACHIEVEMENTS_SCHEMA_VERSION
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[ACH][WRITE] saveAchievements FAILED - uid: ${user.uid}, context: ${context ? `${context.category}/${context.id}` : 'none'}`, error);
      }
      console.error(`Failed to save achievements${context ? ` for ${context.category}/${context.id}` : ''}:`, error);
      throw error;
    }
  };

  // Debounced save function - combines multiple rapid changes into single write
  const scheduleSave = (newAchievements: Achievements, context?: { category: string, id: string }) => {
    // Never schedule saves if user is null
    if (!user) return;

    // Check if this save should be suppressed (state came from firestore/reset)
    if (suppressNextSaveRef.current) return;

    // Store the latest achievements, context, and user UID to save
    pendingAchievementsRef.current = newAchievements;
    pendingContextRef.current = context;
    pendingUidRef.current = user?.uid ?? null;

    // Clear any existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Schedule save with 600ms debounce
    saveTimerRef.current = setTimeout(async () => {
      if (!pendingAchievementsRef.current) return;

      // Check if user has changed since this save was scheduled
      if (!user?.uid || pendingUidRef.current !== user.uid) {
        // User changed or logged out - cancel this save
        pendingAchievementsRef.current = null;
        pendingContextRef.current = undefined;
        pendingUidRef.current = null;
        saveTimerRef.current = null;
        return;
      }

      try {
        await saveAchievements(pendingAchievementsRef.current, pendingContextRef.current);
      } catch (error) {
        // Log error but don't revert state (optimistic UI - state may have advanced)
        console.error('Failed to save achievements after debounce:', error);
      }

      // Clear refs after save attempt
      pendingAchievementsRef.current = null;
      pendingContextRef.current = undefined;
      pendingUidRef.current = null;
      saveTimerRef.current = null;
    }, 600);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, []);

  // Clear pending saves when user changes (logout/login)
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    // Clear pending refs to prevent saves for wrong user
    pendingAchievementsRef.current = null;
    pendingContextRef.current = undefined;
    pendingUidRef.current = null;
  }, [user]);

  // Load achievements from shared user document
  useEffect(() => {
    // Only reset to defaults when auth is resolved and user is actually signed out
    if (authResolved && !user) {
      setAchievementsFromRemote(initialAchievements || defaultAchievements, "reset");
      setLoading(false);
      lastHydratedUidRef.current = null;
      return;
    }

    if (userDocLoading) {
      setLoading(true);
      return; // Wait for user doc to load
    }

    // Only hydrate from userData when conditions are met
    if (!user?.uid) {
      setLoading(false); // No user - ensure loading resolves
      return;
    }

    if (!userData?.achievements) {
      setLoading(false); // No achievements data - ensure loading resolves
      return;
    }

    if (lastHydratedUidRef.current === user.uid) {
      setLoading(false); // Already hydrated - ensure loading resolves
      return;
    }

    // Add failsafe timeout (dev-only)
    const timeoutId =
      process.env.NODE_ENV === "production"
        ? null
        : window.setTimeout(() => {
            console.warn("[useAchievements] load timeout - forcing loading false");
            setError((prev) => prev ?? "Load timeout");
            setLoading(false);
          }, 6000);

    const loadAchievements = async () => {
      setError(null);
      setLoading(true);

      if (process.env.NODE_ENV !== "production") {
        console.log("[useAchievements] start", { uid: user?.uid });
      }
      try {
        // At this point we know user exists and conditions are met for hydration
        const currentUser = user!;
        const data = userData;

      if (process.env.NODE_ENV !== "production") {
        console.log("[useAchievements] received");
      }

        if (data) {
          // Ensure savedAchievements has valid Achievements shape with fallbacks
          const savedAchievements: Achievements = data.achievements && typeof data.achievements === 'object' ? {
            skill: Array.isArray(data.achievements.skill) ? data.achievements.skill : [],
            social: Array.isArray(data.achievements.social) ? data.achievements.social : [],
            collection: Array.isArray(data.achievements.collection) ? data.achievements.collection : [],
          } : defaultAchievements;

          // Check schema version for migration needs
          const savedVersion = data.achievementsSchemaVersion ?? 0;
          const needsMigration = savedVersion !== ACHIEVEMENTS_SCHEMA_VERSION;

          // Check if the saved data has duplicate IDs across all categories (our bug from before)
          const allIds = [
            ...savedAchievements.skill.map((a: Achievement) => a.id),
            ...savedAchievements.social.map((a: Achievement) => a.id),
            ...savedAchievements.collection.map((a: Achievement) => a.id),
          ];
          const hasDuplicateIds = allIds.length !== new Set(allIds).size;

          // Only write to Firestore for true migrations (schema version or corruption)
          if (hasDuplicateIds || needsMigration) {
            // Write when: corrupted data OR schema version changed
            const userDocRef = doc(db, "users", currentUser.uid);
            const achievementsToSave = mergeAchievementsWithTemplate(savedAchievements, initialAchievements || defaultAchievements);
            await updateDoc(userDocRef, {
              achievements: sanitizeAchievementsForFirestore(achievementsToSave),
              achievementsSchemaVersion: ACHIEVEMENTS_SCHEMA_VERSION,
              updatedAt: new Date().toISOString(),
            });
            // Update shared userData locally
            mergeUserData({
              achievements: sanitizeAchievementsForFirestore(achievementsToSave),
              achievementsSchemaVersion: ACHIEVEMENTS_SCHEMA_VERSION
            });

            if (process.env.NODE_ENV !== "production") {
              const progressSummary = Object.entries(achievementsToSave).map(([cat, achievements]) => {
                const withProgress = achievements.filter(a => a.kind === "counter" ? (a as CounterAchievement).progress > 0 : a.isCompleted).length;
                return `${cat}: ${withProgress}/${achievements.length}`;
              }).join(', ');
              console.log(`[ACH][READ] hydrated from firestore - uid: ${currentUser.uid}, progress: ${progressSummary}`);
              }

              setAchievementsFromRemote(achievementsToSave, "firestore");
              lastHydratedUidRef.current = currentUser.uid;
          } else {
            // Normal hydration - merge saved data with template, no Firestore write
            const mergedAchievements = mergeAchievementsWithTemplate(savedAchievements, initialAchievements || defaultAchievements);

            if (process.env.NODE_ENV !== "production") {
              const progressSummary = Object.entries(mergedAchievements).map(([cat, achievements]) => {
                const withProgress = achievements.filter(a => a.kind === "counter" ? (a as CounterAchievement).progress > 0 : a.isCompleted).length;
                return `${cat}: ${withProgress}/${achievements.length}`;
              }).join(', ');
              console.log(`[ACH][READ] hydrated from firestore - uid: ${currentUser.uid}, progress: ${progressSummary}`);
              }

              setAchievementsFromRemote(mergedAchievements, "firestore");
              lastHydratedUidRef.current = currentUser.uid;
          }
        } else {
          // userData exists but achievements is missing - set defaults locally, don't write
          const fallbackAchievements = initialAchievements || defaultAchievements;

          if (process.env.NODE_ENV !== "production") {
            console.log(`[ACH][READ] hydrated from firestore - uid: ${currentUser.uid}, progress: (defaults)`);
          }

          setAchievementsFromRemote(fallbackAchievements, "firestore");
          lastHydratedUidRef.current = currentUser.uid;
        }
      } catch (err: unknown) {
        console.error("[useAchievements] error", err);
        const message =
          err instanceof Error ? err.message : typeof err === "string" ? err : "Load error";
        setError(message);
      } finally {
        if (process.env.NODE_ENV !== "production") {
          console.log("[useAchievements] done");
        }
        setLoading(false);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    loadAchievements();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [authResolved, user, userData, userDocLoading, initialAchievements]);

  const effectiveById = (achs: Achievements): Record<string, Achievement> => {
    const map: Record<string, Achievement> = {};
    for (const cat of ["skill", "social", "collection"] as const) {
      for (const a of achs[cat]) map[a.id] = a;
    }
    return map;
  };

  // Detect newly unlocked secret achievements (requiresId) for one-time modal
  useEffect(() => {
    const catalog = initialAchievements ?? defaultAchievements;
    const allDefs: Achievement[] = [
      ...(catalog.skill ?? []),
      ...(catalog.social ?? []),
      ...(catalog.collection ?? []),
    ];
    const byId = effectiveById(achievements);
    const unlockedNow = new Set<string>();
    for (const def of allDefs) {
      if (isUnlocked(def, byId)) unlockedNow.add(def.id);
    }

    if (firstRunRef.current) {
      firstRunRef.current = false;
      prevUnlockedIdsRef.current = unlockedNow;
      return;
    }

    const newlyUnlocked = allDefs.filter(
      (def) =>
        def.requiresId &&
        unlockedNow.has(def.id) &&
        !prevUnlockedIdsRef.current.has(def.id)
    );
    if (newlyUnlocked.length > 0) {
      setNewUnlocks((prev) => {
        const ids = new Set(prev.map((a) => a.id));
        const deduped = newlyUnlocked.filter((d) => !ids.has(d.id));
        return deduped.length > 0 ? [...prev, ...deduped] : prev;
      });
    }
    prevUnlockedIdsRef.current = unlockedNow;
  }, [achievements, initialAchievements]);

  const clearNewUnlocks = () => setNewUnlocks([]);

  // Toggle a single achievement (only for toggle achievements)
  const toggleAchievement = async (category: keyof Achievements, id: string) => {
    if (!user) return;
    const ach = achievements[category]?.find((a) => a.id === id);
    if (ach && !isUnlocked(ach, effectiveById(achievements))) return;

    const updatedAchievements: Achievements = {
      ...achievements,
      [category]: achievements[category].map((achievement) => {
        if (achievement.id !== id) return achievement;

        // Skip counter achievements - use incrementAchievement instead
        if (achievement.kind === "counter") return achievement;

        const nextCompleted = !achievement.isCompleted;

        const nextCompletedDate =
          nextCompleted
            ? (achievement.completedDate ?? Timestamp.now())
            : undefined;

        const next: Achievement = {
          ...achievement,
          isCompleted: nextCompleted,
          completedDate: nextCompletedDate,
        };
        if (getResetPolicy(achievement) === "yearly") {
          (next as any).year = getCurrentYear();
        }
        return next;
        }),
      };


    setAchievements(updatedAchievements);

    // Schedule debounced save (UI updates immediately, save happens later)
    scheduleSave(updatedAchievements, { category, id });
  };

  // Increment counter achievement progress
  const incrementAchievement = async (category: keyof Achievements, id: string, amount: number = 1) => {
    if (!user) return;
    const ach = achievements[category]?.find((a) => a.id === id);
    if (ach && !isUnlocked(ach, effectiveById(achievements))) return;

    const updatedAchievements: Achievements = {
      ...achievements,
      [category]: achievements[category].map((achievement) => {
        if (achievement.id !== id) return achievement;

        // Only increment counter achievements
        if (achievement.kind !== "counter") return achievement;

        const currentProgress = (achievement as CounterAchievement).progress;
        const target = (achievement as CounterAchievement).target;
        const nextProgress = Math.min(target, Math.max(0, currentProgress + amount));

        const nextCompleted = nextProgress >= target;

        const nextCompletedDate = nextCompleted
          ? (achievement.completedDate ?? Timestamp.now())
          : undefined;

        const next: Achievement = {
          ...achievement,
          progress: nextProgress,
          isCompleted: nextCompleted,
          completedDate: nextCompletedDate,
        };
        if (getResetPolicy(achievement) === "yearly") {
          (next as any).year = getCurrentYear();
        }
        return next;
      }),
    };


    setAchievements(updatedAchievements);

    // Schedule debounced save (UI updates immediately, save happens later)
    scheduleSave(updatedAchievements, { category, id });
  };

  return {
    achievements,
    loading,
    toggleAchievement,
    incrementAchievement,
    saveAchievements,
    newUnlocks,
    clearNewUnlocks,
  };
}

