/**
 * Client-side auth environment helpers. Safe to call on server (returns defaults).
 */

/** Mobile user-agent substrings we recognize. */
const MOBILE_UA_TOKENS = [
  "iPhone",
  "iPod",
  "iPad",
  "Android",
  "webOS",
  "BlackBerry",
  "IEMobile",
  "Opera Mini",
  "Mobile",
];

/**
 * Returns true if the user agent suggests a mobile device.
 * Safe: returns false on server (typeof window === "undefined").
 */
export function isProbablyMobile(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent ?? "";
  return MOBILE_UA_TOKENS.some((token) => ua.includes(token));
}

/**
 * In-app browser tokens: embedded browsers inside social/apps that often block
 * popups and have restricted storage. Conservative list; add more as needed.
 */
const IN_APP_BROWSER_TOKENS = [
  "Instagram", // Instagram in-app browser
  "FBAN",
  "FBAV",
  "FBIOS",
  "FB_IAB", // Facebook in-app
  "Line", // Line app
  "LinkedInApp", // LinkedIn in-app
  "Twitter", // Twitter/X in-app
  "TikTok", // TikTok in-app
];

/**
 * Returns true if the user agent suggests an in-app embedded browser.
 * Safe: returns false on server.
 */
export function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent ?? "";
  return IN_APP_BROWSER_TOKENS.some((token) => ua.includes(token));
}

/**
 * Returns the preferred auth method: "redirect" for mobile/in-app (popups
 * often blocked or unreliable), "popup" otherwise.
 * Safe: returns "popup" on server.
 */
export function getPreferredAuthMethod(): "popup" | "redirect" {
  if (typeof window === "undefined") return "popup";
  if (isProbablyMobile() || isInAppBrowser()) return "redirect";
  return "popup";
}
