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
            setAchievements(savedAchievements);
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
    console.log('🔄 Toggling achievement:', category, id);
    if (!user) {
      console.log('❌ No user, returning');
      return;
    }

    console.log('📊 Current achievements before toggle:', achievements[category].filter(a => a.id === 'skill-0' || a.id === 'skill-11'));

    const updatedAchievements = {
      ...achievements,
      [category]: achievements[category].map(achievement =>
        achievement.id === id
          ? !achievement.isCompleted
            ? {
                ...achievement,
                isCompleted: true,
                completedDate: new Date().toISOString()
              }
            : {
                ...achievement,
                isCompleted: false,
                completedDate: null // Firebase doesn't allow undefined, so we use null
              }
          : achievement
      )
    };

    console.log('📊 Achievements after toggle:', updatedAchievements[category].filter(a => a.id === 'skill-0' || a.id === 'skill-11'));

    // Update local state immediately for UI responsiveness
    setAchievements(updatedAchievements);

    // Save to Firestore (async)
    try {
      await saveAchievements(updatedAchievements);
      console.log('✅ Achievement saved successfully');
    } catch (error) {
      // If save fails, revert the local state change
      console.error("❌ Failed to save achievement:", error);
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

