import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { resolveUsernameToUid } from "./usernames";

export interface PublicProfile {
  uid: string;
  username: string;
  photoURL?: string | null;
  updatedAt?: unknown;
}

/**
 * Resolve username to uid via usernames/{usernameLower}, then read publicProfiles/{uid}.
 * Returns null if username or public profile doc does not exist. Throws on permission-denied.
 */
export async function getPublicProfileByUsername(usernameInput: string): Promise<PublicProfile | null> {
  const uid = await resolveUsernameToUid(usernameInput);
  if (!uid) return null;

  const profilePath = `publicProfiles/${uid}`;
  if (process.env.NODE_ENV !== "production") {
    console.info("[getPublicProfileByUsername] uid:", uid, "path:", profilePath);
  }

  try {
    const profileRef = doc(db, "publicProfiles", uid);
    const snap = await getDoc(profileRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      uid: snap.id,
      username: (data?.username ?? "").toString(),
      photoURL: data?.photoURL ?? null,
      updatedAt: data?.updatedAt,
    };
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "permission-denied") {
      console.error("[getPublicProfileByUsername] permission-denied reading", profilePath, error);
    }
    throw error;
  }
}
