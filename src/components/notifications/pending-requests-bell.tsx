"use client";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function PendingRequestsBell({ count = 0, className }: { count?: number; className?: string }) {
  const has = count > 0;
  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <Bell className={cn("h-5 w-5", has ? "text-red-500" : "text-muted-foreground")} />
      {has && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />}
    </span>
  );
}
