"use client";

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
import { auth, db } from "./firebase";
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
  const [authInitialized, setAuthInitialized] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [redirectSettling, setRedirectSettling] = useState(false);
  const [lastSignInAttempt, setLastSignInAttempt] = useState<string | null>(null);
  const [userDocReady, setUserDocReady] = useState(false);
  const initRanRef = useRef(false);
  const redirectConsumerRanRef = useRef(false);

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    async function ensureUserDoc(u: User): Promise<void> {
      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: u.uid,
          email: u.email ?? null,
          displayName: u.displayName ?? null,
          photoURL: u.photoURL ?? null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
      }

      try {
        await setDoc(doc(db, "publicProfiles", u.uid), {
          displayName: u.displayName ?? null,
          photoURL: u.photoURL ?? null,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        if (DEBUG_AUTH) console.error("AUTH: ensurePublicProfile failed", e);
      }
    }

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
          setUserDocReady(false);

          // If auth state resolved to a user, we are no longer "processing" a redirect.
          try {
            sessionStorage.removeItem("dgjauth_processing");
            sessionStorage.removeItem("dgjauth_return_to");
          } catch {}

          (async () => {
            try {
              await ensureUserDoc(u);
            } catch (e) {
              if (DEBUG_AUTH) console.error("AUTH: ensureUserDoc failed", e);
            } finally {
              setUserDocReady(true);
            }
          })();
        } else {
          setUserDocReady(true);
        }
        setAuthInitialized(true);
        setLoading(false);
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

  useEffect(() => {
    if (redirectConsumerRanRef.current) return;
    redirectConsumerRanRef.current = true;

    const consumeRedirectResult = async () => {
      if (typeof window === "undefined") return;

      const processing = sessionStorage.getItem("dgjauth_processing") === "1";
      const hasApiKey = new URLSearchParams(window.location.search).has("apiKey");
      if (!processing && !hasApiKey) return;

      setRedirectSettling(true);
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
          setRedirectError(
            "Sign-in didn't complete. Please try again. If on mobile/in-app browser, open in Safari or Chrome."
          );
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
          setRedirectError(
            "Login failed: browser storage may be blocked. Try Safari if on iPhone."
          );
        }
        if (DEBUG_AUTH) console.error("AUTH: getRedirectResult error", err);
      } finally {
        setRedirectSettling(false);
      }
    };

    consumeRedirectResult();
  }, []);

  const signInWithGoogle = async () => {
    if (typeof window === "undefined") return;

    setRedirectError(null);
    setRedirectSettling(true);

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
