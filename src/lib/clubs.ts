import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
  setDoc,
  updateDoc,
  writeBatch,
  deleteDoc,
  deleteField,
  onSnapshot,
  orderBy,
  limit as fsLimit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type ClubDoc = {
  name: string;
  joinCode: string;
  createdAt: ReturnType<typeof serverTimestamp> | string;
  createdByUid: string;
};

export type ClubLeaderboardEntry = {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  points: number;
  updatedAt?: Timestamp | null;
};

const JOIN_CODE_LENGTH = 6;
const MAX_CREATE_RETRIES = 5;
const JOIN_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateJoinCode(): string {
  return Array.from({ length: JOIN_CODE_LENGTH }, () =>
    JOIN_CODE_CHARS.charAt(Math.floor(Math.random() * JOIN_CODE_CHARS.length))
  ).join("");
}

async function isJoinCodeTaken(code: string): Promise<boolean> {
  const clubsRef = collection(db, "clubs");
  const q = query(clubsRef, where("joinCode", "==", code), fsLimit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function createClub(
  name: string,
  createdByUid: string
): Promise<{ clubId: string; joinCode: string }> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Club name is required");

  const userRef = doc(db, "users", createdByUid);
  const userSnap = await getDoc(userRef);
  const existingClubId = userSnap.exists() ? (userSnap.data() as { clubId?: string })?.clubId : undefined;
  if (existingClubId) {
    throw new Error("You're already in a club. Leave your current club before joining another.");
  }

  for (let attempt = 0; attempt < MAX_CREATE_RETRIES; attempt++) {
    const joinCode = generateJoinCode();
    const taken = await isJoinCodeTaken(joinCode);
    if (taken) continue;

    const clubRef = doc(collection(db, "clubs"));
    const clubId = clubRef.id;
    const memberRef = doc(db, "clubs", clubId, "members", createdByUid);

    const batch = writeBatch(db);
    batch.set(clubRef, {
      name: trimmedName,
      joinCode,
      createdAt: serverTimestamp(),
      createdByUid,
    });

    const userRef = doc(db, "users", createdByUid);
    batch.update(userRef, {
      clubId,
      clubJoinedAt: serverTimestamp(),
    });

    batch.set(memberRef, { joinedAt: serverTimestamp() }, { merge: true });

    await batch.commit();

    await ensureClubLeaderboardEntry(clubId, createdByUid);

    if (process.env.NODE_ENV !== "production") {
      console.log("[clubs] createClub", { clubId, joinCode, name: trimmedName });
    }

    return { clubId, joinCode };
  }

  throw new Error("Could not generate unique join code. Please try again.");
}

export async function joinClubByCode(
  joinCode: string,
  uid: string
): Promise<void> {
  const code = joinCode.trim().toUpperCase();
  if (!code || code.length !== JOIN_CODE_LENGTH) {
    throw new Error("Invalid join code. Use 6 characters (A-Z, 0-9).");
  }

  const clubsRef = collection(db, "clubs");
  const q = query(clubsRef, where("joinCode", "==", code), fsLimit(1));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("No club found with that code.");
  }

  const clubDoc = snap.docs[0];
  const clubId = clubDoc.id;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(
      userRef,
      { uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  const existingClubId = userSnap.exists() ? (userSnap.data() as { clubId?: string })?.clubId : undefined;
  if (existingClubId) {
    if (existingClubId === clubId) {
      await ensureClubMemberDoc(clubId, uid);
      await ensureClubLeaderboardEntry(clubId, uid);
      return;
    }
    throw new Error("You're already in a club. Leave your current club before joining another.");
  }

  const memberRef = doc(db, "clubs", clubId, "members", uid);
  const batch = writeBatch(db);
  batch.update(userRef, {
    clubId,
    clubJoinedAt: serverTimestamp(),
  });
  batch.set(memberRef, { joinedAt: serverTimestamp() }, { merge: true });

  await batch.commit();

  await ensureClubLeaderboardEntry(clubId, uid);

  if (process.env.NODE_ENV !== "production") {
    console.log("[clubs] joinClubByCode", { uid, clubId, joinCode: code });
  }
}

export async function leaveClub(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  const clubId = userSnap.exists() ? (userSnap.data() as any)?.clubId : null;

  // Delete leaderboard entry and member doc FIRST (while user is still a member) so Firestore rules allow it
  if (clubId && typeof clubId === "string") {
    const clubEntryRef = doc(db, "clubLeaderboards", clubId, "entries", uid);
    await deleteDoc(clubEntryRef);
    const memberRef = doc(db, "clubs", clubId, "members", uid);
    await deleteDoc(memberRef);
  }

  await updateDoc(userRef, {
    clubId: deleteField(),
    clubJoinedAt: deleteField(),
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[clubs] leaveClub", { uid, clubId });
  }
}

export async function ensureClubMemberDoc(clubId: string, uid: string): Promise<void> {
  try {
    await setDoc(
      doc(db, "clubs", clubId, "members", uid),
      { joinedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[clubs] ensureClubMemberDoc failed", err);
    }
  }
}

export async function ensureClubLeaderboardEntry(clubId: string, uid: string): Promise<void> {
  try {
    const publicRef = doc(db, "publicProfiles", uid);
    const publicSnap = await getDoc(publicRef);
    const publicData = publicSnap.exists() ? publicSnap.data() : null;

    const allTimeEntryRef = doc(db, "leaderboards", "allTime", "entries", uid);
    const allTimeSnap = await getDoc(allTimeEntryRef);
    const allTime = allTimeSnap.exists() ? allTimeSnap.data() : null;

    const displayName =
      (publicData?.displayName as string | undefined) ||
      (allTime?.displayName as string | undefined) ||
      "Anonymous";

    const username =
      (publicData?.username as string | undefined) ||
      (allTime?.username as string | undefined) ||
      undefined;

    const photoURL =
      (publicData?.photoURL as string | undefined) ||
      (allTime?.photoURL as string | undefined) ||
      undefined;

    const points = typeof allTime?.points === "number" ? allTime.points : 0;

    const clubEntryRef = doc(db, "clubLeaderboards", clubId, "entries", uid);
    const payload: Record<string, any> = {
      uid,
      displayName,
      points,
      updatedAt: serverTimestamp(),
    };

    if (username) payload.username = username;
    if (photoURL) payload.photoURL = photoURL;

    await setDoc(clubEntryRef, payload, { merge: true });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[clubs] ensureClubLeaderboardEntry failed", err);
    }
  }
}

export async function getClubMemberCount(clubId: string): Promise<number> {
  const membersRef = collection(db, "clubs", clubId, "members");
  const snap = await getCountFromServer(membersRef);
  return snap.data().count;
}

export async function getClubMembers(clubId: string): Promise<string[]> {
  const membersRef = collection(db, "clubs", clubId, "members");
  const q = query(membersRef, fsLimit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

export type ClubMembersSnapshot = { uids: string[]; count: number };

export function subscribeToClubMembers(
  clubId: string,
  onChange: (snap: { uids: string[]; count: number }) => void
): () => void {
  let didEmit = false;
  const membersRef = collection(db, "clubs", clubId, "members");
  const q = query(
    membersRef,
    orderBy("joinedAt", "desc"),
    fsLimit(200)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const uids = snap.docs.map((d) => d.id);
      didEmit = true;
      onChange({ uids, count: snap.size });
    },
    (err) => {
      console.error("[clubs] subscribeToClubMembers error", err);
      didEmit = true;
      onChange({ uids: [], count: 0 });
    }
  );

  return () => {
    unsub();
    if (!didEmit) {
      onChange({ uids: [], count: 0 });
    }
  };
}

export type PublicProfileInfo = {
  displayName?: string;
  username?: string;
  photoURL?: string;
};

export async function getPublicProfiles(
  uids: string[]
): Promise<Record<string, PublicProfileInfo>> {
  const result: Record<string, PublicProfileInfo> = {};
  await Promise.all(
    uids.map(async (uid) => {
      const ref = doc(db, "publicProfiles", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        result[uid] = {
          displayName: d.displayName,
          username: d.username,
          photoURL: d.photoURL,
        };
      } else {
        result[uid] = {};
      }
      return;
    })
  );
  return result;
}

export async function getUserClub(clubId: string): Promise<ClubDoc | null> {
  const clubRef = doc(db, "clubs", clubId);
  const snap = await getDoc(clubRef);
  if (!snap.exists()) return null;
  return snap.data() as ClubDoc;
}

export async function getClubRankForUser(
  clubId: string,
  uid: string
): Promise<{ rank: number; points: number } | null> {
  try {
    const entriesRef = collection(db, "clubLeaderboards", clubId, "entries");
    const q = query(
      entriesRef,
      orderBy("points", "desc"),
      orderBy("updatedAt", "desc"),
      fsLimit(50)
    );
    const snap = await getDocs(q);
    const idx = snap.docs.findIndex((d) => d.id === uid);
    if (idx < 0) return null;
    const data = snap.docs[idx].data();
    return {
      rank: idx + 1,
      points: data.points ?? 0,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[clubs] getClubRankForUser error", err);
    }
    return null;
  }
}

export function subscribeToClubLeaderboard(
  clubId: string,
  onChange: (entries: ClubLeaderboardEntry[]) => void
): () => void {
  let didEmit = false;
  const entriesRef = collection(db, "clubLeaderboards", clubId, "entries");
  const q = query(
    entriesRef,
    orderBy("points", "desc"),
    orderBy("updatedAt", "desc"),
    fsLimit(50)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const entries: ClubLeaderboardEntry[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          displayName: data.displayName || "Anonymous",
          username: data.username,
          photoURL: data.photoURL,
          points: data.points || 0,
          updatedAt: data.updatedAt,
        };
      });
      didEmit = true;
      onChange(entries);
      if (process.env.NODE_ENV !== "production") {
        console.log("[clubs] clubLeaderboard updated", { clubId, count: entries.length });
      }
    },
    (err) => {
      console.error("[clubs] subscribeToClubLeaderboard error", err);
      didEmit = true;
      onChange([]);
    }
  );

  return () => {
    unsub();
    if (!didEmit) {
      onChange([]);
    }
  };
}

export async function selfHealClubMembership(clubId: string, uid: string): Promise<void> {
  // Idempotent repairs
  await ensureClubMemberDoc(clubId, uid);
  await ensureClubLeaderboardEntry(clubId, uid);
}

export async function selfHealUserClub(
  uid: string
): Promise<"ok" | "club_missing_cleared" | "no_club"> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  const clubId = userSnap.exists() ? (userSnap.data() as any)?.clubId : null;

  if (!clubId || typeof clubId !== "string") return "no_club";

  const clubRef = doc(db, "clubs", clubId);
  const clubSnap = await getDoc(clubRef);

  if (!clubSnap.exists()) {
    // Club was deleted or is inaccessible; clear user state so they aren't stuck.
    try {
      await updateDoc(userRef, {
        clubId: deleteField(),
        clubJoinedAt: deleteField(),
      });
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[clubs] selfHealUserClub: failed clearing clubId", e);
      }
    }

    // Best-effort cleanup; ignore failures (rules/network).
    try {
      await deleteDoc(doc(db, "clubLeaderboards", clubId, "entries", uid));
    } catch {}
    try {
      await deleteDoc(doc(db, "clubs", clubId, "members", uid));
    } catch {}

    return "club_missing_cleared";
  }

  await selfHealClubMembership(clubId, uid);
  return "ok";
}
