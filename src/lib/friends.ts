import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Helper to remove undefined and null values from objects before writing to Firestore
function cleanFirestoreData<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  ) as Partial<T>;
}

// Helper for username normalization
const normalizeUsername = (u: any) => (typeof u === "string" && u.trim() ? u.trim() : undefined);

export interface FriendRequest {
  fromUid: string;
  toUid: string;
  fromUsername?: string;
  fromDisplayName?: string;
  fromPhotoURL?: string;
  toUsername?: string;
  createdAt: any; // Firestore Timestamp
  status: "pending" | "accepted" | "declined";
}

export interface Friend {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  createdAt: any; // Firestore Timestamp
}

// Send a friend request to another user
export async function sendFriendRequest(currentUid: string, targetUid: string, targetUsername: string): Promise<void> {
  if (currentUid === targetUid) throw new Error("Cannot send friend request to yourself");

  // Fetch only current user's doc to get sender's username and display info
  const currentUserDoc = await getDoc(doc(db, "users", currentUid));
  const currentUserData = currentUserDoc.data();

  // Normalize and validate usernames
  const fromUsername = normalizeUsername(currentUserData?.profile?.username);
  const toUsername = normalizeUsername(targetUsername);

  if (!fromUsername) {
    throw new Error("You must set a username before sending a friend request.");
  }

  if (!toUsername) {
    throw new Error("Invalid target username.");
  }

  // Check if already friends
  const existingFriendDoc = await getDoc(doc(db, "users", currentUid, "friends", targetUid));
  if (existingFriendDoc.exists()) {
    throw new Error("You're already friends with this user.");
  }

  // Check if outgoing request already exists
  const existingOutReq = await getDoc(doc(db, "users", currentUid, "friendRequestsOut", targetUid));
  if (existingOutReq.exists()) {
    throw new Error("You already sent a friend request to this user.");
  }

  // Extract display fields from current user's profile
  const fromDisplayName = currentUserData?.profile?.displayName ?? null;
  const fromPhotoURL = currentUserData?.profile?.photoURL ?? null;

  // Build payload once
  const payload = cleanFirestoreData({
    fromUid: currentUid,
    toUid: targetUid,
    fromUsername,
    fromDisplayName,
    fromPhotoURL,
    toUsername,
    createdAt: serverTimestamp(),
    status: "pending",
  });

  if (process.env.NODE_ENV !== "production") {
    // Development: Use sequential writes to diagnose which path fails
    try {
      await setDoc(doc(db, "users", currentUid, "friendRequestsOut", targetUid), payload);
    } catch (e) {
      console.error("FAILED writing outgoing request", `users/${currentUid}/friendRequestsOut/${targetUid}`, e);
      throw e;
    }

    try {
      await setDoc(doc(db, "users", targetUid, "friendRequestsIn", currentUid), payload);
    } catch (e) {
      console.error("FAILED writing incoming request", `users/${targetUid}/friendRequestsIn/${currentUid}`, e);
      throw e;
    }

    return;
  }

  // Production: Use atomic writeBatch for all-or-nothing operation
  const batch = writeBatch(db);

  // Add to sender's outgoing requests
  batch.set(doc(db, "users", currentUid, "friendRequestsOut", targetUid), payload);

  // Add to receiver's incoming requests
  batch.set(doc(db, "users", targetUid, "friendRequestsIn", currentUid), payload);

  // Commit atomically
  await batch.commit();
}

// Accept an incoming friend request
export async function acceptFriendRequest(currentUid: string, fromUid: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Read current user's user doc (allowed)
    const currentUserDoc = await getDoc(doc(db, "users", currentUid));
    const currentUserData = currentUserDoc.data();

    // Read the incoming request doc (allowed - it's in current user's subcollection)
    const reqDoc = await getDoc(doc(db, "users", currentUid, "friendRequestsIn", fromUid));
    if (!reqDoc.exists()) throw new Error("Friend request no longer exists.");
    const req = reqDoc.data();

    // Normalize current user's username
    const currentUsername = normalizeUsername(currentUserData?.profile?.username);

    // 1. Create friend document for current user (using data from friend request)
    batch.set(doc(db, "users", currentUid, "friends", fromUid), cleanFirestoreData({
      uid: fromUid,
      displayName: req.fromUsername ? `@${req.fromUsername}` : "Friend",
      username: req.fromUsername,
      photoURL: undefined, // Friend request doesn't include photoURL
      createdAt: serverTimestamp(),
    }));

    // 2. Create friend document for sender (using current user's data)
    batch.set(doc(db, "users", fromUid, "friends", currentUid), cleanFirestoreData({
      uid: currentUid,
      displayName: currentUserData?.profile?.displayName || "Unknown User",
      username: currentUsername,
      photoURL: currentUserData?.profile?.photoURL,
      createdAt: serverTimestamp(),
    }));

    // 3. Delete incoming request from current user
    batch.delete(doc(db, "users", currentUid, "friendRequestsIn", fromUid));

    // 4. Delete outgoing request from the other user
    batch.delete(doc(db, "users", fromUid, "friendRequestsOut", currentUid));

    // Debug logging before commit
    console.log("acceptFriendRequest batch operations:");
    console.log(`  SET /users/${currentUid}/friends/${fromUid}`);
    console.log(`  SET /users/${fromUid}/friends/${currentUid}`);
    console.log(`  DELETE /users/${currentUid}/friendRequestsIn/${fromUid}`);
    console.log(`  DELETE /users/${fromUid}/friendRequestsOut/${currentUid}`);

    // Commit the batch
    await batch.commit();

    console.log("acceptFriendRequest completed successfully");
  } catch (error) {
    console.error("acceptFriendRequest failed", error);
    throw error;
  }
}

// Remove a friend (unilateral)
export async function removeFriend(currentUid: string, friendUid: string): Promise<void> {

  // Remove from both users' friends collections
  await deleteDoc(doc(db, "users", currentUid, "friends", friendUid));
  await deleteDoc(doc(db, "users", friendUid, "friends", currentUid));

  // Clean up any pending requests between them
  try {
    await deleteDoc(doc(db, "users", currentUid, "friendRequestsIn", friendUid));
    await deleteDoc(doc(db, "users", currentUid, "friendRequestsOut", friendUid));
    await deleteDoc(doc(db, "users", friendUid, "friendRequestsIn", currentUid));
    await deleteDoc(doc(db, "users", friendUid, "friendRequestsOut", currentUid));
  } catch (error) {
    // Ignore cleanup errors - friendship is already removed
  }
}

// Get user's friends list
export async function getFriends(currentUid: string): Promise<Friend[]> {
  const friendsSnapshot = await getDocs(collection(db, "users", currentUid, "friends"));
  return friendsSnapshot.docs.map(doc => doc.data() as Friend);
}

// Get incoming friend requests
export async function getIncomingFriendRequests(currentUid: string): Promise<FriendRequest[]> {
  const requestsSnapshot = await getDocs(collection(db, "users", currentUid, "friendRequestsIn"));
  return requestsSnapshot.docs.map(doc => doc.data() as FriendRequest);
}

// Get outgoing friend requests
export async function getOutgoingFriendRequests(currentUid: string): Promise<FriendRequest[]> {
  const requestsSnapshot = await getDocs(collection(db, "users", currentUid, "friendRequestsOut"));
  return requestsSnapshot.docs.map(doc => doc.data() as FriendRequest);
}

// Cancel an outgoing friend request (deletes both sides)
export async function cancelFriendRequest(currentUid: string, targetUid: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete outgoing request
  batch.delete(doc(db, "users", currentUid, "friendRequestsOut", targetUid));

  // Delete incoming request from target
  batch.delete(doc(db, "users", targetUid, "friendRequestsIn", currentUid));

  await batch.commit();
}

// Reject an incoming friend request (deletes both sides)
export async function rejectFriendRequest(currentUid: string, fromUid: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete incoming request
  batch.delete(doc(db, "users", currentUid, "friendRequestsIn", fromUid));

  // Delete outgoing request from sender
  batch.delete(doc(db, "users", fromUid, "friendRequestsOut", currentUid));

  await batch.commit();
}

// DEV-ONLY: Self-test helper to validate Firestore rules for friend request operations
// This creates test docs using the same UID for both sender/receiver to test permissions
export async function debugFriendRequestsSelfTest(uid: string): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("debugFriendRequestsSelfTest is only available in development");
  }

  try {
    // Create refs using same UID for both sender and receiver (self-test)
    const outRef = doc(db, "users", uid, "friendRequestsOut", uid);
    const inRef = doc(db, "users", uid, "friendRequestsIn", uid);

    const testData = {
      fromUid: uid,
      toUid: uid,
      createdAt: serverTimestamp(),
      status: "pending" as const,
    };

    // Test setDoc operations
    await setDoc(outRef, testData);
    await setDoc(inRef, testData);

    // Test getDoc operations
    const outDoc = await getDoc(outRef);
    const inDoc = await getDoc(inRef);

    if (!outDoc.exists()) throw new Error("Failed to read outgoing request doc");
    if (!inDoc.exists()) throw new Error("Failed to read incoming request doc");

    // Test deleteDoc operations
    await deleteDoc(outRef);
    await deleteDoc(inRef);

    // Verify deletions
    const outDocAfter = await getDoc(outRef);
    const inDocAfter = await getDoc(inRef);

    if (outDocAfter.exists()) throw new Error("Failed to delete outgoing request doc");
    if (inDocAfter.exists()) throw new Error("Failed to delete incoming request doc");

    console.log("✅ debugFriendRequestsSelfTest passed: Firestore rules allow all operations");
  } catch (error) {
    console.error("❌ debugFriendRequestsSelfTest failed:", error);
    throw error;
  }
}