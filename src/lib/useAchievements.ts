"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./firebase-auth";

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

// Helper function to check if achievements need updating with points/rarity
function checkAchievementsNeedUpdate(saved: Achievements, template: Achievements): boolean {
  // Check if any achievements are missing points or rarity
  const categories: (keyof Achievements)[] = ['skill', 'social', 'collection'];

  for (const category of categories) {
    // Use safe fallbacks - categories might not exist in corrupted data
    const savedList = saved[category] ?? [];
    const templateList = template[category] ?? [];

    for (let i = 0; i < savedList.length; i++) {
      const savedAchievement = savedList[i];
      const templateAchievement = templateList.find(a => a.id === savedAchievement.id);

      if (templateAchievement) {
        // Check if points or rarity are missing or different
        if (savedAchievement.points !== templateAchievement.points ||
            savedAchievement.rarity !== templateAchievement.rarity) {
          return true;
        }
        // Check if achievements are missing subcategory field
        if (templateAchievement.subcategory && !savedAchievement.subcategory) {
          console.log(`Achievement ${savedAchievement.id} missing subcategory field`);
          return true;
        }
      }
    }
  }

  // Check if template has new achievements that saved data doesn't have
  for (const category of categories) {
    // Use safe fallbacks for length comparison
    const savedList = saved[category] ?? [];
    const templateList = template[category] ?? [];

    if (templateList.length !== savedList.length) {
      console.log(`Achievement count mismatch in ${category}: template has ${templateList.length}, saved has ${savedList.length}`);
      return true;
    }

    // Check if there are achievements in template that aren't in saved data
    for (const templateAchievement of templateList) {
      const savedAchievement = savedList.find(a => a.id === templateAchievement.id);
      if (!savedAchievement) {
        console.log(`New achievement detected in template: ${templateAchievement.id} - ${templateAchievement.title}`);
        return true;
      }
    }
  }

  // Also check if the data structure is completely incompatible (like after major reorganization)
  let totalMatches = 0;
  let totalSaved = 0;

  for (const category of categories) {
    const savedList = saved[category] ?? [];
    const templateList = template[category] ?? [];

    totalSaved += savedList.length;
    for (const savedAchievement of savedList) {
      const templateAchievement = templateList.find(a => a.id === savedAchievement.id);
      if (templateAchievement) {
        totalMatches++;
      }
    }
  }

  // If saved data is empty, re-initialize from template
  if (totalSaved === 0) {
    return true;
  }

  // If less than 50% of achievements match by ID, the data structure has changed too much - reset
  const matchRatio = totalMatches / totalSaved;
  if (matchRatio < 0.5) {
    console.log(`Data structure incompatible: only ${Math.round(matchRatio * 100)}% of achievements match. Resetting to template.`);
    return true;
  }

  return false;
}

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
  const [achievements, setAchievements] = useState<Achievements>(
    initialAchievements || defaultAchievements
  );
  const [loading, setLoading] = useState(true);

  // Load achievements from Firestore
  useEffect(() => {
    if (!user) {
      setAchievements(initialAchievements || defaultAchievements);
      setLoading(false);
      return;
    }

    const loadAchievements = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          // Ensure savedAchievements has valid Achievements shape with fallbacks
          const savedAchievements: Achievements = data.achievements && typeof data.achievements === 'object' ? {
            skill: Array.isArray(data.achievements.skill) ? data.achievements.skill : [],
            social: Array.isArray(data.achievements.social) ? data.achievements.social : [],
            collection: Array.isArray(data.achievements.collection) ? data.achievements.collection : [],
          } : defaultAchievements;

          // Check if user has any saved achievements in any category
          const hasAnySaved =
            savedAchievements &&
            (savedAchievements.skill?.length > 0 ||
             savedAchievements.social?.length > 0 ||
             savedAchievements.collection?.length > 0);

          // If user has saved achievements, use them; otherwise initialize with defaults
          if (hasAnySaved) {
            // Check if the saved data has duplicate IDs (our bug from before)
            const skillIds = savedAchievements.skill.map((a: Achievement) => a.id);
            const hasDuplicateIds = skillIds.length !== new Set(skillIds).size;

            if (hasDuplicateIds) {
              // Reset to defaults if duplicate IDs found
              const achievementsToSave = initialAchievements || defaultAchievements;
              await updateDoc(userDocRef, {
                achievements: sanitizeAchievementsForFirestore(achievementsToSave),
                updatedAt: new Date().toISOString(),
              });
              setAchievements(achievementsToSave);
            } else {
              // Check if achievements need updating (points/rarity or complete restructure)
              const needsUpdate = checkAchievementsNeedUpdate(savedAchievements, initialAchievements || defaultAchievements);
              // Always merge to ensure template order is used (important for achievement ordering)
              const updatedAchievements = mergeAchievementsWithTemplate(savedAchievements, initialAchievements || defaultAchievements);
              if (needsUpdate) {
                await updateDoc(userDocRef, {
                  achievements: sanitizeAchievementsForFirestore(updatedAchievements),
                  updatedAt: new Date().toISOString(),
                });
              }
              setAchievements(updatedAchievements);
            }
          } else {
            // Initialize with default achievements if provided, otherwise empty
            const achievementsToSave = initialAchievements || defaultAchievements;
            await updateDoc(userDocRef, {
              achievements: sanitizeAchievementsForFirestore(achievementsToSave),
              updatedAt: new Date().toISOString(),
            });
            setAchievements(achievementsToSave);
          }
        } else {
          // Create user document with default achievements if it doesn't exist
          const achievementsToSave = initialAchievements || defaultAchievements;
          await setDoc(userDocRef, {
            achievements: sanitizeAchievementsForFirestore(achievementsToSave),
            createdAt: new Date().toISOString(),
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
  }, [user, initialAchievements]);

  // Save achievements to Firestore
  const saveAchievements = async (newAchievements: Achievements, context?: { category: string, id: string }) => {
    if (!user) return;

    try {
      console.log(`Saving achievements${context ? ` for ${context.category}/${context.id}` : ''}...`);
      const userDocRef = doc(db, "users", user.uid);

      await updateDoc(userDocRef, {
        achievements: sanitizeAchievementsForFirestore(newAchievements),
        updatedAt: new Date().toISOString(),
      });

      console.log(`Successfully saved achievements${context ? ` for ${context.category}/${context.id}` : ''}`);
      setAchievements(newAchievements);
    } catch (error) {
      console.error(`Failed to save achievements${context ? ` for ${context.category}/${context.id}` : ''}:`, error);
      throw error;
    }
  };

  // Toggle a single achievement (only for toggle achievements)
  const toggleAchievement = async (category: keyof Achievements, id: string) => {
    if (!user) return;

    const prev = achievements;

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

    try {
      await saveAchievements(updatedAchievements, { category, id });
    } catch (error) {
      console.error(`Reverting achievements due to save failure for ${category}/${id}:`, error);
      setAchievements(prev);
    }
  };

  // Increment counter achievement progress
  const incrementAchievement = async (category: keyof Achievements, id: string, amount: number = 1) => {
    if (!user) return;

    const prev = achievements;

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

    try {
      await saveAchievements(updatedAchievements, { category, id });
    } catch (error) {
      console.error(`Reverting achievements due to save failure for ${category}/${id}:`, error);
      setAchievements(prev);
    }
  };

  return {
    achievements,
    loading,
    toggleAchievement,
    incrementAchievement,
    saveAchievements,
  };
}

