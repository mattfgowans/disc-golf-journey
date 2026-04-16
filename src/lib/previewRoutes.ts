/** Append `preview=true` so in-app links keep guest preview mode. */
export function hrefWithPreview(href: string, previewActive: boolean): string {
  if (!previewActive) return href;
  const hashIdx = href.indexOf("#");
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
  const base = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  if (base.includes("?")) return `${base}&preview=true${hash}`;
  return `${base}?preview=true${hash}`;
}
