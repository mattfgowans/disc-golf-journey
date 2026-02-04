"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useIncomingFriendRequestsCount(
  currentUserId: string | undefined
): { count: number; loading: boolean } {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      setCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "users", currentUserId, "friendRequestsIn"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setCount(snap.size);
        setLoading(false);
      },
      (err) => {
        console.error("[useIncomingFriendRequestsCount] snapshot error", err);
        setCount(0);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  return { count, loading };
}

