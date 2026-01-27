"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserProfile = { username?: string; profile?: { username?: string } };

export function useUserProfile(uid: string | null | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(!!uid);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setError(null);

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
      } catch (err) {
        if (!cancelled) {
          console.error("useUserProfile getDoc failed", err);
          setError((err as any)?.code ?? "profile_fetch_failed");
          setProfile(null);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { profile, loading, error };
}