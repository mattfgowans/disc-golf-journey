"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserProfile = { username?: string };

export function useUserProfile(uid: string | null | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(!!uid);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!uid) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!cancelled) {
          setProfile((snap.data() as UserProfile) ?? {});
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setProfile({});
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { profile, loading };
}