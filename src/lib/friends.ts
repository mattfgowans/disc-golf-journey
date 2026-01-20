import { doc, setDoc, deleteDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export interface FriendRequest {
  fromUid: string;
  toUid: string;
  timestamp: string;
  status: "pending" | "accepted" | "declined";
}

export interface Friend {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  addedAt: string;
}

// Send a friend request to another user
export async function sendFriendRequest(currentUid: string, targetUid: string): Promise<void> {
  if (currentUid === targetUid) throw new Error("Cannot send friend request to yourself");

  // Check if target user exists
  const targetUserDoc = await getDoc(doc(db, "users", targetUid));
  if (!targetUserDoc.exists()) throw new Error("User not found");

  const requestData: Omit<FriendRequest, 'status'> = {
    fromUid: currentUid,
    toUid: targetUid,
    timestamp: new Date().toISOString(),
  };

  // Add to sender's outgoing requests
  await setDoc(doc(db, "users", currentUid, "friendRequestsOut", targetUid), {
    ...requestData,
    status: "pending",
  });

  // Add to receiver's incoming requests
  await setDoc(doc(db, "users", targetUid, "friendRequestsIn", currentUid), {
    ...requestData,
    status: "pending",
  });
}

// Accept an incoming friend request
export async function acceptFriendRequest(currentUid: string, fromUid: string): Promise<void> {
  const timestamp = new Date().toISOString();

  // Update the request status
  await setDoc(doc(db, "users", currentUid, "friendRequestsIn", fromUid), {
    fromUid,
    toUid: currentUid,
    timestamp,
    status: "accepted",
  }, { merge: true });

  await setDoc(doc(db, "users", fromUid, "friendRequestsOut", currentUid), {
    fromUid,
    toUid: currentUid,
    timestamp,
    status: "accepted",
  }, { merge: true });

  // Add to both users' friends collections
  const currentUserDoc = await getDoc(doc(db, "users", currentUid));
  const fromUserDoc = await getDoc(doc(db, "users", fromUid));

  const currentUserData = currentUserDoc.data();
  const fromUserData = fromUserDoc.data();

  await setDoc(doc(db, "users", currentUid, "friends", fromUid), {
    uid: fromUid,
    displayName: fromUserData?.profile?.displayName || "Unknown User",
    username: fromUserData?.profile?.username,
    photoURL: fromUserData?.profile?.photoURL,
    addedAt: timestamp,
  });

  await setDoc(doc(db, "users", fromUid, "friends", currentUid), {
    uid: currentUid,
    displayName: currentUserData?.profile?.displayName || "Unknown User",
    username: currentUserData?.profile?.username,
    photoURL: currentUserData?.profile?.photoURL,
    addedAt: timestamp,
  });
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