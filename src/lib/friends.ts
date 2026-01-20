import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface FriendRequest {
  fromUid: string;
  toUid: string;
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
export async function sendFriendRequest(currentUid: string, targetUid: string): Promise<void> {
  if (currentUid === targetUid) throw new Error("Cannot send friend request to yourself");

  // Check if target user exists
  const targetUserDoc = await getDoc(doc(db, "users", targetUid));
  if (!targetUserDoc.exists()) throw new Error("User not found");

  // Add to sender's outgoing requests
  await setDoc(doc(db, "users", currentUid, "friendRequestsOut", targetUid), {
    fromUid: currentUid,
    toUid: targetUid,
    createdAt: serverTimestamp(),
    status: "pending",
  });

  // Add to receiver's incoming requests
  await setDoc(doc(db, "users", targetUid, "friendRequestsIn", currentUid), {
    fromUid: currentUid,
    toUid: targetUid,
    createdAt: serverTimestamp(),
    status: "pending",
  });
}

// Accept an incoming friend request
export async function acceptFriendRequest(currentUid: string, fromUid: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Get user data for both users
    const [currentUserDoc, fromUserDoc] = await Promise.all([
      getDoc(doc(db, "users", currentUid)),
      getDoc(doc(db, "users", fromUid))
    ]);

    const currentUserData = currentUserDoc.data();
    const fromUserData = fromUserDoc.data();

    // 1. Create friend document for current user
    batch.set(doc(db, "users", currentUid, "friends", fromUid), {
      uid: fromUid,
      displayName: fromUserData?.profile?.displayName || "Unknown User",
      username: fromUserData?.profile?.username || null,
      photoURL: fromUserData?.profile?.photoURL || null,
      createdAt: serverTimestamp(),
    });

    // 2. Create friend document for the other user
    batch.set(doc(db, "users", fromUid, "friends", currentUid), {
      uid: currentUid,
      displayName: currentUserData?.profile?.displayName || "Unknown User",
      username: currentUserData?.profile?.username || null,
      photoURL: currentUserData?.profile?.photoURL || null,
      createdAt: serverTimestamp(),
    });

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