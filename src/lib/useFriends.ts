"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { resolveUsernameToUid, normalizeUsername } from "@/lib/usernames";
import {
  Friend,
  FriendRequest,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from "@/lib/friends";

export function useFriends(uid: string | null) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const friendsReadyRef = useRef(false);
  const inReadyRef = useRef(false);
  const outReadyRef = useRef(false);

  useEffect(() => {
    if (!uid) {
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setIsLoading(false);
      setError(null);
      friendsReadyRef.current = false;
      inReadyRef.current = false;
      outReadyRef.current = false;
      return;
    }

    setIsLoading(true);
    setError(null);
    friendsReadyRef.current = false;
    inReadyRef.current = false;
    outReadyRef.current = false;

    const unsubFriends = onSnapshot(
      collection(db, "users", uid, "friends"),
      (snap) => {
        setFriends(snap.docs.map((d) => d.data() as Friend));
        friendsReadyRef.current = true;
        if (inReadyRef.current && outReadyRef.current) setIsLoading(false);
      },
      (err) => {
        setError(err?.message ?? "Failed to load friends");
        setIsLoading(false);
      }
    );

    const unsubIn = onSnapshot(
      collection(db, "users", uid, "friendRequestsIn"),
      (snap) => {
        setIncomingRequests(snap.docs.map((d) => d.data() as FriendRequest));
        inReadyRef.current = true;
        if (friendsReadyRef.current && outReadyRef.current) setIsLoading(false);
      },
      (err) => {
        setError(err?.message ?? "Failed to load incoming requests");
        setIsLoading(false);
      }
    );

    const unsubOut = onSnapshot(
      collection(db, "users", uid, "friendRequestsOut"),
      (snap) => {
        setOutgoingRequests(snap.docs.map((d) => d.data() as FriendRequest));
        outReadyRef.current = true;
        if (friendsReadyRef.current && inReadyRef.current) setIsLoading(false);
      },
      (err) => {
        setError(err?.message ?? "Failed to load outgoing requests");
        setIsLoading(false);
      }
    );

    return () => {
      unsubFriends();
      unsubIn();
      unsubOut();
    };
  }, [uid]);

  const friendsByUid = useMemo(
    () => Object.fromEntries(friends.map((f) => [f.uid, true] as const)),
    [friends]
  );
  const incomingByUid = useMemo(
    () => Object.fromEntries(incomingRequests.map((r) => [r.fromUid, true] as const)),
    [incomingRequests]
  );
  const outgoingByUid = useMemo(
    () => Object.fromEntries(outgoingRequests.map((r) => [r.toUid, true] as const)),
    [outgoingRequests]
  );

  const sendByUsername = useCallback(
    async (usernameInput: string): Promise<void> => {
      if (!uid) throw new Error("Not signed in");
      const normalized = normalizeUsername(usernameInput);
      if (!normalized) throw new Error("Invalid username.");
      const targetUid = await resolveUsernameToUid(normalized);
      if (!targetUid) throw new Error("User not found.");
      if (targetUid === uid) throw new Error("You can't add yourself as a friend.");
      if (friendsByUid[targetUid]) throw new Error("You're already friends with this user.");
      if (outgoingByUid[targetUid]) throw new Error("You already sent a friend request to this user.");
      if (incomingByUid[targetUid]) throw new Error("This user already sent you a friend request.");

      const prev = [...outgoingRequests];
      const optimistic: FriendRequest = {
        fromUid: uid,
        toUid: targetUid,
        toUsername: normalized,
        createdAt: null as any,
        status: "pending",
      };
      setOutgoingRequests((prev) =>
        prev.some((r) => r.toUid === targetUid) ? prev : [...prev, optimistic]
      );

      try {
        await sendFriendRequest(uid, targetUid, normalized);
      } catch (e) {
        setOutgoingRequests(prev);
        throw e;
      }
    },
    [uid, friendsByUid, incomingByUid, outgoingByUid, outgoingRequests]
  );

  const accept = useCallback(
    async (fromUid: string): Promise<void> => {
      if (!uid) throw new Error("Not signed in");
      const req = incomingRequests.find((r) => r.fromUid === fromUid);
      const prevIncoming = [...incomingRequests];
      const prevFriends = [...friends];

      setIncomingRequests((prev) => prev.filter((r) => r.fromUid !== fromUid));
      const placeholderFriend: Friend = {
        uid: fromUid,
        displayName: req?.fromDisplayName && String(req.fromDisplayName).trim()
          ? req.fromDisplayName
          : req?.fromUsername
            ? `@${req.fromUsername}`
            : "Friend",
        username: req?.fromUsername,
        photoURL: req?.fromPhotoURL,
        createdAt: null as any,
      };
      if (!friendsByUid[fromUid]) {
        setFriends((prev) => [...prev, placeholderFriend]);
      }

      try {
        await acceptFriendRequest(uid, fromUid);
      } catch (e) {
        setIncomingRequests(prevIncoming);
        setFriends(prevFriends);
        throw e;
      }
    },
    [uid, friends, friendsByUid, incomingRequests]
  );

  const reject = useCallback(
    async (fromUid: string): Promise<void> => {
      if (!uid) throw new Error("Not signed in");
      const prev = [...incomingRequests];
      setIncomingRequests((prev) => prev.filter((r) => r.fromUid !== fromUid));

      try {
        await rejectFriendRequest(uid, fromUid);
      } catch (e) {
        setIncomingRequests(prev);
        throw e;
      }
    },
    [uid, incomingRequests]
  );

  const cancel = useCallback(
    async (toUid: string): Promise<void> => {
      if (!uid) throw new Error("Not signed in");
      const prev = [...outgoingRequests];
      setOutgoingRequests((prev) => prev.filter((r) => r.toUid !== toUid));

      try {
        await cancelFriendRequest(uid, toUid);
      } catch (e) {
        setOutgoingRequests(prev);
        throw e;
      }
    },
    [uid, outgoingRequests]
  );

  const unfriend = useCallback(
    async (friendUid: string): Promise<void> => {
      if (!uid) throw new Error("Not signed in");
      const prev = [...friends];
      setFriends((prev) => prev.filter((f) => f.uid !== friendUid));

      try {
        await removeFriend(uid, friendUid);
      } catch (e) {
        setFriends(prev);
        throw e;
      }
    },
    [uid, friends]
  );

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    friendsByUid,
    incomingByUid,
    outgoingByUid,
    isLoading,
    error,
    actions: {
      sendByUsername,
      accept,
      reject,
      cancel,
      unfriend,
    },
  };
}

// Example usage in friends page:
// const { friends, incomingRequests, outgoingRequests, friendsByUid, incomingByUid, outgoingByUid, isLoading, error, actions } = useFriends(user?.uid ?? null);
// actions.sendByUsername(inputValue);
// actions.accept(req.fromUid);
// actions.reject(req.fromUid);
// actions.cancel(req.toUid);
// actions.unfriend(friend.uid);
