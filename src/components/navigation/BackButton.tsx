"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  fallbackHref: string;
  label?: string;
  className?: string;
};

export function BackButton({
  fallbackHref,
  label,
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = React.useCallback(() => {
    const idx = typeof window !== "undefined" ? (window.history.state as any)?.idx : undefined;
    const canGoBack =
      typeof idx === "number"
        ? idx > 0
        : typeof document !== "undefined" && !!document.referrer;

    if (canGoBack) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  }, [router, fallbackHref]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={className}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label ? <span className="text-sm">{label}</span> : null}
    </Button>
  );
}
