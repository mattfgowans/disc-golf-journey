"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./firebase-auth";

export function useUserDoc() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [userExists, setUserExists] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      setUserExists(false);
      setLoading(false);
      return;
    }

    // Reset loading state when user changes
    setLoading(true);

    let active = true;
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (!active) return;
        const exists = docSnap.exists();
        if (process.env.NODE_ENV !== "production") {
          console.log("[useUserDoc] snapshot", {
            uid: user.uid,
            exists,
            data: exists ? docSnap.data() : null,
          });
        }
        setUserExists(exists);
        setUserData(exists ? (docSnap.data() as any) : null);
        setLoading(false);
      },
      (error) => {
        if (!active) return;
        if (process.env.NODE_ENV !== "production") {
          console.log("[useUserDoc] snapshot ERROR", {
            uid: user.uid,
            message: error?.message,
            code: (error as any)?.code,
          });
        }
        console.error("Error listening to user document:", error);
        setUserExists(false);
        setUserData(null);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
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