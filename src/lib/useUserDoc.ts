"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./firebase-auth";

export function useUserDoc() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [userExists, setUserExists] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setUserData(null);
      setUserExists(false);
      setLoading(false);
      return;
    }

    // Reset loading state when user changes
    setLoading(true);

    const fetchUserDoc = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        // Avoid calling exists() twice by storing result
        const exists = docSnap.exists();
        if (cancelled) return;
        setUserExists(exists);
        setUserData(exists ? (docSnap.data() as any) : null);
      } catch (error) {
        console.error("Error fetching user document:", error);
        if (cancelled) return;
        setUserExists(false);
        setUserData(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUserDoc();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Safe helper to merge data into userData
  const mergeUserData = (patch: Record<string, any>) => {
    setUserData(prev => ({ ...(prev ?? {}), ...patch }));
  };

  return {
    userData,
    mergeUserData,
    userExists,
    loading,
  };
}