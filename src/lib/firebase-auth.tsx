"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  getRedirectResult,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  AuthError,
} from "firebase/auth";
import { auth } from "./firebase";

const DEBUG_AUTH = true;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authInitialized: boolean;
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
  const [authInitialized, setAuthInitialized] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [redirectSettling, setRedirectSettling] = useState(false);
  const [lastSignInAttempt, setLastSignInAttempt] = useState<string | null>(null);
  const signInPromiseRef = useRef<Promise<void> | null>(null);
  const initRanRef = useRef(false);
  const signInStartedRef = useRef(false);
  const redirectConsumerRanRef = useRef(false);

  // Consume redirect result when returning from signInWithRedirect (e.g. popup was blocked).
  // Do NOT treat null result as error—it will often be null when using popup.
  useEffect(() => {
    if (redirectConsumerRanRef.current) return;
    redirectConsumerRanRef.current = true;

    const consumeRedirectResult = async () => {
      if (typeof window === "undefined") return;
      setRedirectSettling(true);
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        if (DEBUG_AUTH) console.log("AUTH: redirect consume setPersistence failed", e);
      }
      try {
        const result = await getRedirectResult(auth);
        if (DEBUG_AUTH) {
          console.log("AUTH: getRedirectResult", { hasResult: !!result, hasUser: !!result?.user });
        }
        if (result?.user && typeof window !== "undefined") {
          sessionStorage.removeItem("dgjauth_processing");
          sessionStorage.removeItem("dgjauth_return_to");
          sessionStorage.removeItem("dgjauth_redirect_started");
          localStorage.removeItem("dgjauth_redirect_started");
          localStorage.removeItem("dgjauth_redirect_started_at");
          localStorage.removeItem("dgjauth_redirect_from");
        }
      } catch (err: unknown) {
        const code = (err as AuthError)?.code;
        const msg = String((err as { message?: string })?.message ?? "");
        const readable =
          code === "auth/missing-initial-state" || msg.toLowerCase().includes("storage")
            ? "Login failed: browser storage may be blocked. Try Safari if on iPhone."
            : "Sign-in failed. Please try again.";
        setRedirectError(readable);
        if (DEBUG_AUTH) console.error("AUTH: getRedirectResult error", err);
      } finally {
        setRedirectSettling(false);
      }
    };

    consumeRedirectResult();
  }, []);

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    const init = async () => {
      if (DEBUG_AUTH) console.error("AUTH: init");
      try {
        await setPersistence(auth, browserLocalPersistence);
        if (DEBUG_AUTH) console.error("AUTH: persistence=local");
      } catch (e) {
        if (DEBUG_AUTH) console.error("AUTH: persistence failed", String(e));
      }

      const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (DEBUG_AUTH) {
          if (u) {
            console.log("AUTH: onAuthStateChanged -> user", { uid: u.uid, email: u.email ?? null });
          } else {
            console.log("AUTH: onAuthStateChanged -> null");
          }
        }
        setUser(u ?? null);
        if (u) {
          setRedirectError(null);
          setRedirectSettling(false);
        }
        setAuthInitialized(true);
        setLoading(false);
        signInPromiseRef.current = null;
      });

      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    init().then((unsub) => {
      unsubscribe = unsub ?? undefined;
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (typeof window === "undefined") return;
    if (signInStartedRef.current) return;
    signInStartedRef.current = true;

    setRedirectError(null);
    setRedirectSettling(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
      if (DEBUG_AUTH) console.log("AUTH: signInWithGoogle setPersistence failed", e);
    }

    sessionStorage.setItem("dgjauth_return_to", "/dashboard");
    sessionStorage.setItem("dgjauth_processing", "1");

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    if (DEBUG_AUTH) {
      console.log("AUTH: signInWithGoogle -> trying popup first", {
        href: window.location.href,
        dgjauth_processing: sessionStorage.getItem("dgjauth_processing"),
        signInStartedRef: signInStartedRef.current,
      });
    }

    try {
      await signInWithPopup(auth, provider);
      signInStartedRef.current = false;
    } catch (err: unknown) {
      const code = (err as AuthError)?.code;
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        if (DEBUG_AUTH) console.log("AUTH: popup blocked/cancelled, falling back to redirect");
        await signInWithRedirect(auth, provider);
      } else {
        signInStartedRef.current = false;
        setRedirectSettling(false);
        const msg = String((err as { message?: string })?.message ?? "");
        const readable =
          code === "auth/missing-initial-state" || msg.toLowerCase().includes("storage")
            ? "Login failed: browser storage may be blocked. Try Safari if on iPhone."
            : "Sign-in failed. Please try again.";
        setRedirectError(readable);
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
