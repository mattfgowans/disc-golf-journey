import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmzEPiyQL9Cv79i-P52ZuzHAeUWWN9kjE",
  authDomain: "disc-golf-journey.firebaseapp.com",
  projectId: "disc-golf-journey",
  storageBucket: "disc-golf-journey.firebasestorage.app",
  messagingSenderId: "733159317120",
  appId: "1:733159317120:web:1c7ec48f4d260c00b3d065",
};

// Initialize Firebase (singleton: reuse existing app if already initialized)
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
export const db: Firestore = getFirestore(app);

if (process.env.NODE_ENV !== "production") {
  console.log("[FIREBASE] app name:", app.name, "| auth instance:", auth.app?.name ?? "n/a");
}

console.error("[FIREBASE CONFIG]", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});

// Conditionally connect to emulators in development
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
  if (process.env.NODE_ENV !== "production") {
    console.log("[FIREBASE] Connecting to emulators...");

    // Connect Firestore emulator
    connectFirestoreEmulator(db, "localhost", 8080);

    // Connect Auth emulator
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });

    console.log("[FIREBASE] Connected to emulators");
  }
}

// Dev-only startup log
if (process.env.NODE_ENV !== "production") {
  const isUsingEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
  console.log(`[FIREBASE] project=${app.options.projectId} emulator=${isUsingEmulator}`);
}

export default app;

