"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "dgj-beta-banner-dismissed";

export function BetaBanner() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  if (!mounted || dismissed) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-2 md:px-6 md:pt-3">
      <div className="relative rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm md:px-4 md:py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-7 w-7 shrink-0 text-muted-foreground"
          onClick={handleDismiss}
          aria-label="Dismiss beta banner"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="pr-9">
          <div className="text-muted-foreground">
            Disc Golf Journey is in beta. Things may be a little rough — your
            feedback helps a ton.
          </div>
          <div className="mt-2">
            <a
              href="https://forms.gle/usGuEsyy5LZJA7Wy6"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              Send Feedback
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
