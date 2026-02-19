/**
 * Storage availability checks for auth. In-app browsers (Instagram, Facebook, etc.)
 * and iOS private modes may block localStorage/sessionStorage, which breaks redirect
 * auth recovery (getRedirectResult returns null, "missing initial state").
 */

const TEST_KEY = "__auth_storage_test__";

/**
 * Returns true if both localStorage and sessionStorage are usable.
 * Safe: returns false on server (typeof window === "undefined").
 */
export async function hasUsableStorage(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(TEST_KEY, "1");
    if (localStorage.getItem(TEST_KEY) !== "1") return false;
    localStorage.removeItem(TEST_KEY);
  } catch {
    return false;
  }

  try {
    sessionStorage.setItem(TEST_KEY, "1");
    if (sessionStorage.getItem(TEST_KEY) !== "1") return false;
    sessionStorage.removeItem(TEST_KEY);
  } catch {
    return false;
  }

  return true;
}
