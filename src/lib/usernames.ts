import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Normalizes a username input by trimming whitespace, removing leading "@",
 * converting to lowercase, filtering to allowed characters, collapsing consecutive
 * dots/underscores, and returning empty string if invalid.
 */
export function normalizeUsername(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Trim whitespace and remove leading "@"
  const trimmed = input.trim().replace(/^@/, "");

  // Convert to lowercase
  const lowercased = trimmed.toLowerCase();

  // Keep only letters, numbers, underscore, and dot
  const filtered = lowercased.replace(/[^a-z0-9_.]/g, "");

  // Collapse multiple consecutive dots and underscores
  const collapsed = filtered.replace(/_{2,}/g, "_").replace(/\.{2,}/g, ".");

  // Remove leading/trailing dots and underscores
  const cleaned = collapsed.replace(/^[_.\s]+|[_.\s]+$/g, "");

  // Return empty string if result is empty
  return cleaned || "";
}

/**
 * Resolves a username to a user ID by looking up the username in Firestore.
 * Returns the UID if found, null if doc does not exist. Throws on permission-denied (do not swallow).
 */
export async function resolveUsernameToUid(usernameInput: string): Promise<string | null> {
  const normalizedUsername = normalizeUsername(usernameInput);

  if (!normalizedUsername) {
    return null;
  }

  const path = `usernames/${normalizedUsername}`;
  if (process.env.NODE_ENV !== "production") {
    console.info("[resolveUsernameToUid] normalized:", normalizedUsername, "path:", path);
  }

  try {
    const usernameDocRef = doc(db, "usernames", normalizedUsername);
    const usernameDoc = await getDoc(usernameDocRef);

    if (usernameDoc.exists()) {
      const data = usernameDoc.data();
      return data?.uid || null;
    }

    return null;
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "permission-denied") {
      console.error("[resolveUsernameToUid] permission-denied reading", path, error);
      throw error;
    }
    throw error;
  }
}