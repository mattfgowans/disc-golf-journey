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
 * Returns the UID if found, null if not found or invalid.
 */
export async function resolveUsernameToUid(usernameInput: string): Promise<string | null> {
  const normalizedUsername = normalizeUsername(usernameInput);

  // Return null if username is empty/invalid after normalization
  if (!normalizedUsername) {
    return null;
  }

  try {
    // Read the document at usernames/{normalizedUsername}
    const usernameDocRef = doc(db, "usernames", normalizedUsername);
    const usernameDoc = await getDoc(usernameDocRef);

    if (usernameDoc.exists()) {
      // Return the uid field from the document
      const data = usernameDoc.data();
      return data?.uid || null;
    }

    // Username not found
    return null;
  } catch (error) {
    console.error("Error resolving username to UID:", error);
    return null;
  }
}