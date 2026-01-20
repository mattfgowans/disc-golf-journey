"use client";

import { useState, useEffect, useRef } from "react";
import { doc, setDoc, updateDoc, runTransaction, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./firebase-auth";
import { useUserDoc } from "./useUserDoc";
import { normalizeUsername } from "./usernames";

export interface UserProfile {
  displayName: string;
  photoURL?: string;
  bio: string;
  homeCourse: string;
  handedness: "RHBH" | "RHFH" | "LHBH" | "LHFH";
  isPublic: boolean;
  username?: string; // unique, lowercase
  usernameLower?: string; // normalized lowercase version for lookups
  friendCode?: string; // short code like ABC123
}

const defaultProfile: Omit<UserProfile, 'displayName' | 'photoURL'> = {
  bio: "",
  homeCourse: "",
  handedness: "RHBH",
  isPublic: false,
};

export function useUserProfile() {
  const { user } = useAuth();
  const { userData, mergeUserData, loading: userDocLoading } = useUserDoc();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Debounced profile save refs
  const profileSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProfileRef = useRef<UserProfile | null>(null);
  const pendingProfileContextRef = useRef<{ source: string } | undefined>(undefined);
  const pendingUidRef = useRef<string | null>(null);

  // Persist profile to Firestore (internal function)
  const persistProfile = async (profileToSave: UserProfile, context?: { source: string }) => {
    if (!user) return;

    console.log(`Saving profile${context ? ` from ${context.source}` : ''}...`);

    // Handle username uniqueness and mapping
    const currentUsernameLower = profile?.usernameLower || "";
    const newUsernameLower = profileToSave.usernameLower || "";

    // Use transaction if username is being set/changed
    if (newUsernameLower !== currentUsernameLower) {
      await runTransaction(db, async (transaction) => {
        // If setting a new username, check if it's already taken
        if (newUsernameLower) {
          const usernameDocRef = doc(db, "usernames", newUsernameLower);
          const usernameDoc = await transaction.get(usernameDocRef);

          if (usernameDoc.exists()) {
            const existingData = usernameDoc.data();
            if (existingData?.uid !== user.uid) {
              throw new Error("Username already taken");
            }
          }

          // Set the new username mapping
          transaction.set(usernameDocRef, {
            uid: user.uid,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }

        // Clean up old username mapping if it exists and belongs to current user
        if (currentUsernameLower) {
          const oldUsernameDocRef = doc(db, "usernames", currentUsernameLower);
          const oldUsernameDoc = await transaction.get(oldUsernameDocRef);

          // Only delete if the document exists and belongs to the current user
          if (oldUsernameDoc.exists()) {
            const oldData = oldUsernameDoc.data();
            if (oldData?.uid === user.uid) {
              transaction.delete(oldUsernameDocRef);
            }
          }
        }
      });
    }

    // Save the profile data
    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      profile: profileToSave,
      updatedAt: new Date().toISOString(),
    });

    console.log(`Successfully saved profile${context ? ` from ${context.source}` : ''}`);

      // Update shared userData locally
      mergeUserData({ profile: profileToSave });
  };

  // Debounced profile save function
  const scheduleProfileSave = (profileToSave: UserProfile, context?: { source: string }) => {
    // Store the latest profile, context, and user UID to save
    pendingProfileRef.current = profileToSave;
    pendingProfileContextRef.current = context;
    pendingUidRef.current = user?.uid ?? null;

    // Clear any existing timer
    if (profileSaveTimerRef.current) {
      clearTimeout(profileSaveTimerRef.current);
    }

    // Schedule save with 800ms debounce
    profileSaveTimerRef.current = setTimeout(async () => {
      if (!pendingProfileRef.current) return;

      // Check if user has changed since this save was scheduled
      if (!user?.uid || pendingUidRef.current !== user.uid) {
        // User changed or logged out - cancel this save
        pendingProfileRef.current = null;
        pendingProfileContextRef.current = undefined;
        pendingUidRef.current = null;
        profileSaveTimerRef.current = null;
        return;
      }

      try {
        await persistProfile(pendingProfileRef.current, pendingProfileContextRef.current);
      } catch (error) {
        // Log error but don't revert state (optimistic UI - state may have advanced)
        console.error('Failed to save profile after debounce:', error);
      }

      // Clear refs after save attempt
      pendingProfileRef.current = null;
      pendingProfileContextRef.current = undefined;
      pendingUidRef.current = null;
      profileSaveTimerRef.current = null;
    }, 800);
  };

  // Load profile from shared user document
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (userDocLoading) {
      setLoading(true);
      return; // Wait for user doc to load
    }

    const loadProfile = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);

        if (userData) {
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

            // Update shared userData state directly
            mergeUserData({ profile: newProfile });

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

          // Update shared userData state directly
          mergeUserData({ profile: newProfile });

          setProfile(newProfile);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, userData, userDocLoading]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (profileSaveTimerRef.current) {
        clearTimeout(profileSaveTimerRef.current);
        profileSaveTimerRef.current = null;
      }
    };
  }, []);

  // Clear pending saves when user changes (logout/login)
  useEffect(() => {
    if (profileSaveTimerRef.current) {
      clearTimeout(profileSaveTimerRef.current);
      profileSaveTimerRef.current = null;
    }
    // Clear pending refs to prevent saves for wrong user
    pendingProfileRef.current = null;
    pendingProfileContextRef.current = undefined;
    pendingUidRef.current = null;
  }, [user]);

  // Update profile function
  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user || !profile) return;

    // Prepare profile with username normalization
    const profileUpdates = { ...updates };

    // If username is being updated, normalize it and store both versions
    if (profileUpdates.username !== undefined) {
      const normalizedUsername = normalizeUsername(profileUpdates.username);
      profileUpdates.username = normalizedUsername;
      profileUpdates.usernameLower = normalizedUsername;
    }

    const updatedProfile = { ...profile, ...profileUpdates };

    // Update UI immediately (optimistic)
    setProfile(updatedProfile);
    mergeUserData({ profile: updatedProfile });

    // Schedule debounced save (Firestore write happens later)
    scheduleProfileSave(updatedProfile, { source: "updateProfile" });
  };

  return {
    profile,
    loading,
    updateProfile,
  };
}