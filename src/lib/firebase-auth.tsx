"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "./firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


function withTimeout<T>(promise: Promise<T>, ms: number, message = "Sign-in timed out") {
  let timeoutId: number | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  }) as Promise<T>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Store the actual in-flight PROMISE (not a boolean)
  const signInPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    // Handle redirect result on app load (before attaching auth state listener)
    getRedirectResult(auth).catch((error) => {
      console.warn("Redirect result error (non-critical):", error);
      // Don't break the app if redirect handling fails
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);

      // If auth state changes, clear any stale in-flight lock
      signInPromiseRef.current = null;
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // If a sign-in attempt is already running, return the same promise.
    if (signInPromiseRef.current) return signInPromiseRef.current;

    const provider = new GoogleAuthProvider();

    const attempt = (async () => {
      try {
        // Set auth persistence to browser local storage
        await setPersistence(auth, browserLocalPersistence);

        // Try popup first (works on most devices)
        await withTimeout(signInWithPopup(auth, provider), 10000, "Sign-in popup timed out");
      } catch (err: any) {
        const code = err?.code as string | undefined;

        // Try redirect fallback for popup failures
        if (
          code === "auth/popup-blocked" ||
          code === "auth/popup-closed-by-user" ||
          code === "auth/operation-not-supported"
        ) {
          try {
            console.log("Popup failed, trying redirect fallback...");
            await signInWithRedirect(auth, provider);
            return;
          } catch (redirectErr: any) {
            console.error("Both popup and redirect failed:", { popupError: err, redirectError: redirectErr });
            throw new Error("Sign-in failed. Please check your browser settings and try again.");
          }
        }

        // Handle other error cases
        const msg = (err?.message ?? "").toLowerCase();
        const isMissingInitialState =
          code === "auth/missing-initial-state" ||
          msg.includes("missing initial state") ||
          msg.includes("sessionstorage") ||
          msg.includes("storage-partition");

        // Detect Firebase redirect state issues (common on iOS in-app browsers)
        if (isMissingInitialState) {
          throw new Error("Login failed due to browser storage restrictions. If you're on iPhone, open this link in Safari (not inside Messages) and try again.");
        }

        // Normal user behaviors: don't treat as error
        if (code === "auth/cancelled-popup-request") {
          return;
        }

        // Timeout error (from our wrapper) - fall back to redirect
        if (err instanceof Error && err.message === "Sign-in popup timed out") {
          try {
            console.log("Popup timed out, trying redirect fallback...");
            await signInWithRedirect(auth, provider);
            return;
          } catch (redirectErr: any) {
            console.error("Both popup and redirect failed:", { popupError: err, redirectError: redirectErr });
            throw new Error("Sign-in failed. Please check your browser settings and try again.");
          }
        }

        console.error("Google sign-in failed:", err);
        throw new Error("Sign-in failed. Please try again.");
      } finally {
        // Always clear so the button can be clicked again
        signInPromiseRef.current = null;
      }
    })();

    signInPromiseRef.current = attempt;
    return attempt;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
