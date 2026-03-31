"use client";

'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  AuthError,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const DEBUG_AUTH = true;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authInitialized: boolean;
  userDocReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  redirectError: string | null;
  redirectSettling: boolean;
  lastSignInAttempt: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authInitialized = !loading;
  const redirectError = null;
  const redirectSettling = false;
  const lastSignInAttempt = null;
  const userDocReady = true;
  const redirectConsumerRanRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[AUTH] resolved:", user);

      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (redirectConsumerRanRef.current) return;
    redirectConsumerRanRef.current = true;

    const consumeRedirectResult = async () => {
      if (typeof window === "undefined") return;

      const processing = sessionStorage.getItem("dgjauth_processing") === "1";
      const hasApiKey = new URLSearchParams(window.location.search).has("apiKey");
      if (!processing && !hasApiKey) return;

      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("dgjauth_processing");
            sessionStorage.removeItem("dgjauth_return_to");
          }
        } else {
          sessionStorage.removeItem("dgjauth_processing");
          sessionStorage.removeItem("dgjauth_return_to");
        }
        if (result === null && DEBUG_AUTH) {
          console.log("AUTH: getRedirectResult null (popup may have been used, or no redirect)");
        }
      } catch (err: unknown) {
        const code = (err as AuthError)?.code;
        const msg = String((err as { message?: string })?.message ?? "");
        if (
          code === "auth/missing-initial-state" ||
          msg.toLowerCase().includes("storage")
        ) {
        }
        if (DEBUG_AUTH) console.error("AUTH: getRedirectResult error", err);
      }
    };

    consumeRedirectResult();
  }, []);

  const signInWithGoogle = async () => {
    if (typeof window === "undefined") return;

    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
      if (DEBUG_AUTH) console.log("AUTH: signInWithGoogle setPersistence failed", e);
    }

    sessionStorage.setItem("dgjauth_return_to", "/dashboard");

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    if (DEBUG_AUTH) {
      console.log("AUTH: signInWithGoogle -> trying popup first", {
        href: window.location.href,
        dgjauth_processing: sessionStorage.getItem("dgjauth_processing"),
      });
    }

    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code = (err as AuthError)?.code;
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        if (DEBUG_AUTH) console.log("AUTH: popup blocked/cancelled, falling back to redirect");
        sessionStorage.setItem("dgjauth_processing", "1");
        sessionStorage.setItem("dgjauth_redirect_started_at", String(Date.now()));
        await signInWithRedirect(auth, provider);
      } else {
        const msg = String((err as { message?: string })?.message ?? "");
        throw err;
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authInitialized,
        userDocReady,
        signInWithGoogle,
        signOut,
        redirectError,
        redirectSettling,
        lastSignInAttempt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
