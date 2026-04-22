"use client";

import { useEffect, useState } from "react";

const MOBILE_MAX_INNER_WIDTH = 768;

export function OrientationGuard() {
  const [showRotateScreen, setShowRotateScreen] = useState(false);

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth < MOBILE_MAX_INNER_WIDTH;
      const isLandscape = window.innerWidth > window.innerHeight;
      setShowRotateScreen(isMobile && isLandscape);
    };

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);

    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (!showRotateScreen) return null;

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
