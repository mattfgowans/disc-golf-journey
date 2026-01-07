"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./firebase-auth";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  category: "skill" | "social" | "collection";
  isCompleted: boolean;
  completedDate?: string;
  points?: number;
  rarity?: "common" | "rare" | "epic" | "legendary";
};

export type Achievements = {
  skill: Achievement[];
  social: Achievement[];
  collection: Achievement[];
};

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
    for (let i = 0; i < saved[category].length; i++) {
      const savedAchievement = saved[category][i];
      const templateAchievement = template[category].find(a => a.id === savedAchievement.id);

      if (templateAchievement) {
        // Check if points or rarity are missing or different
        if (savedAchievement.points !== templateAchievement.points ||
            savedAchievement.rarity !== templateAchievement.rarity) {
          return true;
        }
      }
    }
  }

  // Also check if the data structure is completely incompatible (like after major reorganization)
  let totalMatches = 0;
  let totalSaved = 0;

  for (const category of categories) {
    totalSaved += saved[category].length;
    for (const savedAchievement of saved[category]) {
      const templateAchievement = template[category].find(a => a.id === savedAchievement.id);
      if (templateAchievement) {
        totalMatches++;
      }
    }
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
function mergeAchievementsWithTemplate(saved: Achievements, template: Achievements): Achievements {
  const categories: (keyof Achievements)[] = ['skill', 'social', 'collection'];

  // For now, always use template data to ensure correct organization
  console.log('Using template data to ensure correct achievement organization.');
  return template;

  // Normal merge for compatible data
  const merged: Achievements = {
    skill: [],
    social: [],
    collection: []
  };

  for (const category of categories) {
    merged[category] = saved[category].map(savedAchievement => {
      const templateAchievement = template[category].find(a => a.id === savedAchievement.id);
      if (templateAchievement) {
        // Merge saved data with template data, preserving completion status
        return {
          ...templateAchievement,
          isCompleted: savedAchievement.isCompleted,
          completedDate: savedAchievement.completedDate
        };
      }
      return savedAchievement;
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
          const savedAchievements = data.achievements;

          // If user has saved achievements, use them; otherwise initialize with defaults
          if (savedAchievements && savedAchievements.skill?.length > 0) {
            // Check if the saved data has duplicate IDs (our bug from before)
            const skillIds = savedAchievements.skill.map((a: Achievement) => a.id);
            const hasDuplicateIds = skillIds.length !== new Set(skillIds).size;

            if (hasDuplicateIds) {
              // Reset to defaults if duplicate IDs found
              const achievementsToSave = initialAchievements || defaultAchievements;
              await setDoc(userDocRef, {
                achievements: achievementsToSave,
                createdAt: new Date().toISOString(),
              });
              setAchievements(achievementsToSave);
            } else {
              // Check if achievements need updating (points/rarity or complete restructure)
              const needsUpdate = checkAchievementsNeedUpdate(savedAchievements, initialAchievements || defaultAchievements);
              if (needsUpdate) {
                const updatedAchievements = mergeAchievementsWithTemplate(savedAchievements, initialAchievements || defaultAchievements);
                await setDoc(userDocRef, {
                  achievements: updatedAchievements,
                  createdAt: new Date().toISOString(),
                });
                setAchievements(updatedAchievements);
              } else {
                setAchievements(savedAchievements);
              }
            }
          } else {
            // Initialize with default achievements if provided, otherwise empty
            const achievementsToSave = initialAchievements || defaultAchievements;
            await setDoc(userDocRef, {
              achievements: achievementsToSave,
              createdAt: new Date().toISOString(),
            });
            setAchievements(achievementsToSave);
          }
        } else {
          // Create user document with default achievements if it doesn't exist
          const achievementsToSave = initialAchievements || defaultAchievements;
          await setDoc(userDocRef, {
            achievements: achievementsToSave,
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
  const saveAchievements = async (newAchievements: Achievements) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);

      // Clean the data before saving (remove null completedDate fields)
      const cleanAchievements = {
        skill: newAchievements.skill.map(a => {
          const { completedDate, ...rest } = a;
          return completedDate ? { ...rest, completedDate } : rest;
        }),
        social: newAchievements.social.map(a => {
          const { completedDate, ...rest } = a;
          return completedDate ? { ...rest, completedDate } : rest;
        }),
        collection: newAchievements.collection.map(a => {
          const { completedDate, ...rest } = a;
          return completedDate ? { ...rest, completedDate } : rest;
        }),
      };

      await updateDoc(userDocRef, {
        achievements: cleanAchievements,
        updatedAt: new Date().toISOString(),
      });
      setAchievements(newAchievements);
    } catch (error) {
      console.error("Error saving achievements:", error);
      throw error;
    }
  };

  // Toggle a single achievement
  const toggleAchievement = async (
    category: keyof Achievements,
    id: string
  ) => {
    if (!user) return;

    const updatedAchievements = {
      ...achievements,
      [category]: achievements[category].map(achievement =>
        achievement.id === id
          ? {
              ...achievement,
              isCompleted: !achievement.isCompleted,
              completedDate: !achievement.isCompleted ? new Date().toISOString() : null
            }
          : achievement
      )
    };

    // Update local state immediately for UI responsiveness
    setAchievements(updatedAchievements);

    // Save to Firestore (async)
    try {
      await saveAchievements(updatedAchievements);
    } catch (error) {
      // If save fails, revert the local state change
      console.error("Failed to save achievement:", error);
      setAchievements(achievements);
    }
  };

  return {
    achievements,
    loading,
    toggleAchievement,
    saveAchievements,
  };
}

