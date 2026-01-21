import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

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
  const app = getApp();
  const isUsingEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
  console.log(`[FIREBASE] project=${app.options.projectId} emulator=${isUsingEmulator}`);
}

export default app;

