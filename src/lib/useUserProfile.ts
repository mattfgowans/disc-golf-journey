"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./firebase-auth";

export interface UserProfile {
  displayName: string;
  photoURL?: string;
  bio: string;
  homeCourse: string;
  handedness: "RHBH" | "RHFH" | "LHBH" | "LHFH";
  isPublic: boolean;
}

const defaultProfile: Omit<UserProfile, 'displayName' | 'photoURL'> = {
  bio: "",
  homeCourse: "",
  handedness: "RHBH",
  isPublic: false,
};

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile from Firestore
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userProfile = userData.profile;

          if (userProfile) {
            // Profile exists, use it
            setProfile(userProfile);
          } else {
            // Profile missing, initialize with Google auth data + defaults
            const newProfile: UserProfile = {
              displayName: user.displayName || "Anonymous Player",
              photoURL: user.photoURL || undefined,
              ...defaultProfile,
            };

            // Save the new profile to Firestore
            await setDoc(userDocRef, {
              profile: newProfile,
              updatedAt: new Date().toISOString(),
            }, { merge: true });

            setProfile(newProfile);
          }
        } else {
          // User document doesn't exist, create it with profile
          const newProfile: UserProfile = {
            displayName: user.displayName || "Anonymous Player",
            photoURL: user.photoURL || undefined,
            ...defaultProfile,
          };

          await setDoc(userDocRef, {
            profile: newProfile,
            createdAt: new Date().toISOString(),
          });

          setProfile(newProfile);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Update profile function
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const updatedProfile = { ...profile, ...updates };

      await updateDoc(userDocRef, {
        profile: updatedProfile,
        updatedAt: new Date().toISOString(),
      });

      setProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  return {
    profile,
    loading,
    updateProfile,
  };
}