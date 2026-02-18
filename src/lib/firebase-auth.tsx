// Redirect preferred for iOS and in-app browsers; desktop uses popup. getRedirectResult runs once on load.

"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  getRedirectResult,
  AuthError,
} from "firebase/auth";
import { auth } from "./firebase";
import { shouldPreferRedirect, isIOS, isInAppBrowser } from "./authEnv";

const DEBUG_AUTH = true;

async function ensurePersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence);
    if (DEBUG_AUTH) console.error("AUTH: persistence=local");
  } catch (e) {
    try {
      await setPersistence(auth, browserSessionPersistence);
      if (DEBUG_AUTH) console.error("AUTH: persistence=session (fallback)", String(e));
    } catch (e2) {
      if (DEBUG_AUTH) console.error("AUTH: persistence failed", String(e2));
    }
  }
}

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
  redirectSettling: boolean;
  lastSignInAttempt: string | null;
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
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEBUG_AUTH) console.error("AUTH: init");
    if (DEBUG_AUTH) {
      const lsOk = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
      try {
        if (lsOk) window.localStorage.setItem("__auth_check", "1");
        console.error("AUTH: persistence check", { localStorageAvailable: lsOk });
        if (lsOk) window.localStorage.removeItem("__auth_check");
      } catch (e) {
        console.log("AUTH: persistence check", { localStorageAvailable: false, error: String(e) });
      }
    }
  }, []);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [redirectSettling, setRedirectSettling] = useState(false);
  const [lastSignInAttempt, setLastSignInAttempt] = useState<string | null>(null);

  // Store the actual in-flight PROMISE (not a boolean)
  const signInPromiseRef = useRef<Promise<void> | null>(null);
  const redirectHandledRef = useRef(false);

  // Handle redirect result once on app load (skip when callback page handles it)
  useEffect(() => {
    if (redirectHandledRef.current) return;
    if (pathname === "/auth/callback") {
      redirectHandledRef.current = true;
      return;
    }
    redirectHandledRef.current = true;
    setRedirectSettling(true);

    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const { uid, email } = result.user;
          console.error("AUTH: redirect result -> user", { uid, email: email ?? null });
        } else {
          console.error("AUTH: redirect result -> null");
        }
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
      } finally {
        setRedirectSettling(false);
      }
    })();
  }, [pathname]);

  // Register auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (DEBUG_AUTH) {
        if (u) {
          console.error("AUTH: state -> user", { uid: u.uid, email: u.email ?? null });
        } else {
          console.error("AUTH: state -> null");
        }
      }
      setUser(u);
      if (u) setRedirectError(null);
      setLoading(false);
      signInPromiseRef.current = null;
      if (process.env.NODE_ENV !== "production" && !DEBUG_AUTH) {
        console.log("[Auth] state", { uid: u?.uid ?? null });
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setLastSignInAttempt(`clicked ${new Date().toLocaleTimeString()}`);
    console.error("LOGIN: clicked sign in");

    // If a sign-in attempt is already running, return the same promise.
    if (signInPromiseRef.current) return signInPromiseRef.current;

    const attempt = (async () => {
      try {
        setRedirectError(null);

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        await setPersistence(auth, browserSessionPersistence);
        console.error("AUTH: persistence=session (forced redirect)");
        setRedirectSettling(true);
        console.error("AUTH: starting signInWithRedirect");
        await signInWithRedirect(auth, provider);
        return;
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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, redirectError, redirectSettling, lastSignInAttempt }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
