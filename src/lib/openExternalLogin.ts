/** Try opening a URL in a new tab (best chance to escape webview); fallback navigates current window after a short delay. */
export function openUrlInNewTabWithFallback(url: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    window.location.href = url;
  }, 500);
}

/** Production login URL — use for in-app browser escape flows. */
export function openExternalLoginUrl(): void {
  openUrlInNewTabWithFallback("https://disc-golf-journey.web.app/login");
}
