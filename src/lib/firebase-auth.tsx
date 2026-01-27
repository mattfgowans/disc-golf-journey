// Redirect preferred in in-app browsers (not iOS). Popup falls back to redirect. getRedirectResult guarded to prevent loops.

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
  AuthError,
} from "firebase/auth";
import { auth } from "./firebase";
import { shouldPreferRedirect } from "./authEnv";

function isPopupFallbackError(e: unknown) {
  const code = (e as AuthError | undefined)?.code;
  return (
    code === "auth/popup-blocked" ||
    code === "auth/popup-closed-by-user" ||
    code === "auth/operation-not-supported-in-this-environment"
  );
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  redirectError: string | null;
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
  const [redirectError, setRedirectError] = useState<string | null>(null);

  // Store the actual in-flight PROMISE (not a boolean)
  const signInPromiseRef = useRef<Promise<void> | null>(null);
  const redirectHandledRef = useRef(false);

  // Handle redirect result once on app load
  useEffect(() => {
    if (redirectHandledRef.current) return;
    redirectHandledRef.current = true;

    (async () => {
      try {
        await getRedirectResult(auth);
      } catch (error: any) {
        const code = error?.code as string | undefined;
        const msg = (error?.message ?? "").toLowerCase();
        const isMissingInitialState =
          code === "auth/missing-initial-state" ||
          msg.includes("missing initial state") ||
          msg.includes("sessionstorage") ||
          msg.includes("storage-partition");

        console.error("Redirect result error:", error);

        if (isMissingInitialState) {
          setRedirectError("Sign-in failed due to browser storage restrictions. If you're on iPhone, open this link in Safari (not inside Messages) and try again.");
        } else {
          setRedirectError("Sign-in failed. Please try again.");
        }
      }
    })();
  }, []);

  // Register auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setRedirectError(null);
      setLoading(false);
      signInPromiseRef.current = null;
      if (process.env.NODE_ENV !== "production") {
        console.log("[Auth] state", { uid: u?.uid ?? null });
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    // If a sign-in attempt is already running, return the same promise.
    if (signInPromiseRef.current) return signInPromiseRef.current;

    const attempt = (async () => {
      try {
        setRedirectError(null);
        await setPersistence(auth, browserLocalPersistence);

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        if (shouldPreferRedirect()) {
          await signInWithRedirect(auth, provider);
          return;
        }

        try {
          await withTimeout(signInWithPopup(auth, provider), 15000, "Sign-in popup timed out");
        } catch (e: any) {
          if (isPopupFallbackError(e)) {
            await signInWithRedirect(auth, provider);
            return;
          }
          throw e;
        }
      } catch (err: any) {
        const code = err?.code as string | undefined;

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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, redirectError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
