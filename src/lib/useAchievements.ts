"use client";

import { useState, useEffect, useRef } from "react";
import { doc, setDoc, updateDoc, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./firebase-auth";
import { useUserDoc } from "./useUserDoc";
import { computePointTotals, getPeriodKeys } from "./points";

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
// Keeps saved data as source of truth for completion + completedDate
// Automatically includes new achievements from the template
function mergeAchievementsWithTemplate(saved: Achievements, template: Achievements): Achievements {
  const categories: (keyof Achievements)[] = ["skill", "social", "collection"];

  const merged: Achievements = { skill: [], social: [], collection: [] };

  for (const category of categories) {
    merged[category] = template[category].map((templateAchievement) => {
      const savedAchievement = saved[category]?.find((a) => a.id === templateAchievement.id);

      // Base merged achievement from template
      const mergedAchievement: Achievement = {
        ...templateAchievement,
        completedDate: savedAchievement?.completedDate,
      };

      // For counter achievements, preserve progress and recompute isCompleted from progress/target
      if (templateAchievement.kind === "counter") {
        const savedProgress =
          savedAchievement && typeof (savedAchievement as any).progress === "number"
            ? (savedAchievement as any).progress
            : (templateAchievement as any).progress;

        (mergedAchievement as CounterAchievement).progress = savedProgress;

        mergedAchievement.isCompleted =
          savedProgress >= (templateAchievement as CounterAchievement).target;
      } else {
        // For toggle achievements, preserve isCompleted from saved data
        mergedAchievement.isCompleted = savedAchievement?.isCompleted ?? false;
      }

      return mergedAchievement;
    });
  }

  return merged;
}

export function useAchievements(initialAchievements?: Achievements) {
  const { user } = useAuth();
  const { userData, mergeUserData, loading: userDocLoading } = useUserDoc();
  const [achievements, setAchievements] = useState<Achievements>(
    initialAchievements || defaultAchievements
  );
  const [loading, setLoading] = useState(true);

  // Debounced save refs
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAchievementsRef = useRef<Achievements | null>(null);
  const pendingContextRef = useRef<{ category: string; id: string } | undefined>(undefined);
  const pendingUidRef = useRef<string | null>(null);

  // Save achievements to Firestore
  const saveAchievements = async (newAchievements: Achievements, context?: { category: string, id: string }) => {
    if (!user) return;

    try {
      console.log(`Saving achievements${context ? ` for ${context.category}/${context.id}` : ''}...`);

      // Use writeBatch for atomic updates
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // Update user achievements
      const userDocRef = doc(db, "users", user.uid);
      batch.update(userDocRef, {
        achievements: sanitizeAchievementsForFirestore(newAchievements),
        achievementsSchemaVersion: ACHIEVEMENTS_SCHEMA_VERSION,
        updatedAt: now,
      });

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
      const userInfo = {
        displayName: userData?.profile?.displayName || user.displayName || "Anonymous",
        username: userData?.profile?.username || null,
        photoURL: userData?.profile?.photoURL || user.photoURL || null,
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

      console.log(`Successfully saved achievements${context ? ` for ${context.category}/${context.id}` : ''}`);
      // Update shared userData state locally
      mergeUserData({
        achievements: sanitizeAchievementsForFirestore(newAchievements),
        achievementsSchemaVersion: ACHIEVEMENTS_SCHEMA_VERSION
      });
    } catch (error) {
      console.error(`Failed to save achievements${context ? ` for ${context.category}/${context.id}` : ''}:`, error);
      throw error;
    }
  };

  // Debounced save function - combines multiple rapid changes into single write
  const scheduleSave = (newAchievements: Achievements, context?: { category: string, id: string }) => {
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
    if (!user) {
      setAchievements(initialAchievements || defaultAchievements);
      setLoading(false);
      return;
    }

    if (userDocLoading) {
      setLoading(true);
      return; // Wait for user doc to load
    }

    const loadAchievements = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);

        if (userData) {
          const data = userData;
          // Ensure savedAchievements has valid Achievements shape with fallbacks
          const savedAchievements: Achievements = data.achievements && typeof data.achievements === 'object' ? {
            skill: Array.isArray(data.achievements.skill) ? data.achievements.skill : [],
            social: Array.isArray(data.achievements.social) ? data.achievements.social : [],
            collection: Array.isArray(data.achievements.collection) ? data.achievements.collection : [],
          } : defaultAchievements;

          // Check schema version for migration needs
          const savedVersion = data.achievementsSchemaVersion ?? 0;
          const needsMigration = savedVersion !== ACHIEVEMENTS_SCHEMA_VERSION;

          // Check if user has any saved achievements in any category
          const hasAnySaved =
            savedAchievements &&
            (savedAchievements.skill?.length > 0 ||
             savedAchievements.social?.length > 0 ||
             savedAchievements.collection?.length > 0);

          // If user has saved achievements, use them; otherwise initialize with defaults
          if (hasAnySaved) {
            // Check if the saved data has duplicate IDs across all categories (our bug from before)
            const allIds = [
              ...savedAchievements.skill.map((a: Achievement) => a.id),
              ...savedAchievements.social.map((a: Achievement) => a.id),
              ...savedAchievements.collection.map((a: Achievement) => a.id),
            ];
            const hasDuplicateIds = allIds.length !== new Set(allIds).size;

            if (hasDuplicateIds || needsMigration) {
              // Write when: corrupted data OR schema version changed
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
              setAchievements(achievementsToSave);
            } else {
              // No write needed - just merge locally for display
              const updatedAchievements = mergeAchievementsWithTemplate(savedAchievements, initialAchievements || defaultAchievements);
              setAchievements(updatedAchievements);
            }
          } else {
            // Initialize with default achievements if provided, otherwise empty
            const achievementsToSave = initialAchievements || defaultAchievements;
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
            setAchievements(achievementsToSave);
          }
        } else {
          // Create user document with default achievements if it doesn't exist
          const achievementsToSave = initialAchievements || defaultAchievements;
          await setDoc(userDocRef, {
            achievements: sanitizeAchievementsForFirestore(achievementsToSave),
            achievementsSchemaVersion: ACHIEVEMENTS_SCHEMA_VERSION,
            createdAt: new Date().toISOString(),
          });
          // Update shared userData locally
          mergeUserData({
            achievements: sanitizeAchievementsForFirestore(achievementsToSave),
            achievementsSchemaVersion: ACHIEVEMENTS_SCHEMA_VERSION
          });
          setAchievements(achievementsToSave);
        }
      } catch (error) {
        console.error("Error loading achievements:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [user, userData, userDocLoading, initialAchievements]);

  // Toggle a single achievement (only for toggle achievements)
  const toggleAchievement = async (category: keyof Achievements, id: string) => {
    if (!user) return;

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

        return {
          ...achievement,
          isCompleted: nextCompleted,
          completedDate: nextCompletedDate,
        };
      }),
    };

    setAchievements(updatedAchievements);

    // Schedule debounced save (UI updates immediately, save happens later)
    scheduleSave(updatedAchievements, { category, id });
  };

  // Increment counter achievement progress
  const incrementAchievement = async (category: keyof Achievements, id: string, amount: number = 1) => {
    if (!user) return;

    const updatedAchievements: Achievements = {
      ...achievements,
      [category]: achievements[category].map((achievement) => {
        if (achievement.id !== id) return achievement;

        // Only increment counter achievements
        if (achievement.kind !== "counter") return achievement;

        const currentProgress = (achievement as CounterAchievement).progress;
        const target = (achievement as CounterAchievement).target;
        const nextProgress = Math.min(target, Math.max(0, currentProgress + amount));

        // Once completed, stay completed forever (progress can fluctuate but completion is permanent)
        const wasAlreadyCompleted = achievement.isCompleted;
        const nextCompleted = wasAlreadyCompleted || nextProgress >= target;

        // Set completedDate only the FIRST time it becomes completed
        const nextCompletedDate =
          nextCompleted && !achievement.completedDate
            ? Timestamp.now()
            : achievement.completedDate;

        return {
          ...achievement,
          progress: nextProgress,
          isCompleted: nextCompleted,
          completedDate: nextCompletedDate,
        };
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
  };
}

