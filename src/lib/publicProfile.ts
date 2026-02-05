import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { resolveUsernameToUid, normalizeUsername } from "./usernames";

export interface PublicProfile {
  uid: string;
  username: string;
  photoURL?: string | null;
  updatedAt?: unknown;
}

function toPublicProfile(uid: string, data: Record<string, unknown> | null): PublicProfile {
  const rawPhoto = data?.photoURL;
  const photoURL = rawPhoto != null && typeof rawPhoto === "string" ? rawPhoto : null;
  return {
    uid,
    username: (data?.username ?? "").toString(),
    photoURL,
    updatedAt: data?.updatedAt,
  };
}

/**
 * Resolve username to uid via usernames/{usernameLower}, then read publicProfiles/{uid}.
 * Returns null only when usernames doc is missing (no such user).
 * If publicProfiles doc is missing: when currentUid === uid, backfill from users/{uid} then return;
 * otherwise return a synthetic profile (username from mapping, no photo) so the user is still resolvable.
 * Throws on permission-denied.
 */
export async function getPublicProfileByUsername(
  usernameInput: string,
  options?: { currentUid?: string | null }
): Promise<PublicProfile | null> {
  const normalized = normalizeUsername(usernameInput);
  if (!normalized) return null;

  const uid = await resolveUsernameToUid(usernameInput);
  if (!uid) return null;

  const profilePath = `publicProfiles/${uid}`;
  const currentUid = options?.currentUid ?? null;
  if (process.env.NODE_ENV !== "production") {
    console.info("[getPublicProfileByUsername] uid:", uid, "path:", profilePath);
  }

  try {
    const profileRef = doc(db, "publicProfiles", uid);
    let snap = await getDoc(profileRef);
    if (snap.exists()) {
      return toPublicProfile(snap.id, snap.data());
    }

    // publicProfiles doc missing: backfill if viewer is the owner, else return synthetic profile
    if (currentUid != null && currentUid === uid) {
      let photoURL: string | null = null;
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          const d = userSnap.data() as Record<string, unknown>;
          const profile = d?.profile as Record<string, unknown> | undefined;
          photoURL = (profile?.photoURL ?? d?.photoURL) as string | null ?? null;
        }
      } catch {
        // ignore; use null photoURL
      }
      await setDoc(profileRef, {
        uid,
        username: normalized,
        photoURL,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      snap = await getDoc(profileRef);
      if (snap.exists()) return toPublicProfile(snap.id, snap.data());
    }

    return toPublicProfile(uid, { username: normalized, photoURL: null });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "permission-denied") {
      console.error("[getPublicProfileByUsername] permission-denied reading", profilePath, error);
    }
    throw error;
  }
}
