"use client";

import { useEffect, useState } from "react";

export function OrientationGuard() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (!isLandscape) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background px-6 text-center">
      <div>
        <div className="text-4xl mb-4">📱</div>
        <h2 className="text-xl font-semibold mb-2">Rotate your phone</h2>
        <p className="text-sm text-muted-foreground">
          Disc Golf Journey works best in portrait mode.
        </p>
      </div>
    </div>
  );
}
