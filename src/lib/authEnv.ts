export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = /Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
  return iOSDevice || iPadOS;
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /FBAN|FBAV|Instagram|Line|Twitter|LinkedInApp|Snapchat|Pinterest/.test(ua) ||
    /wv/.test(ua) ||
    /WebView/.test(ua) ||
    (/(iPhone|iPad|iPod)/.test(ua) && !/Safari/.test(ua))
  );
}

export function shouldPreferRedirect(): boolean {
  return isIOS() || isInAppBrowser();
}