"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Trophy, Users, BadgeCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase-auth";

function normalizePath(p: string): string {
  return p.endsWith("/") && p.length > 1 ? p.slice(0, -1) : p;
}

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    isActive: (p: string) => p === "/" || p.startsWith("/dashboard"),
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    color: "text-amber-500",
    bg: "bg-amber-50",
    isActive: (p: string) => p.startsWith("/leaderboard"),
  },
  {
    href: "/friends",
    label: "Friends",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-50",
    isActive: (p: string) => p.startsWith("/friends"),
  },
  {
    href: "/patches",
    label: "Patches",
    icon: BadgeCheck,
    color: "text-purple-500",
    bg: "bg-purple-50",
    isActive: (p: string) => p.startsWith("/patches"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    color: "text-pink-500",
    bg: "bg-pink-50",
    isActive: (p: string) => p.startsWith("/profile"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { user, loading, redirectSettling } = useAuth();
  const path = normalizePath(pathname);

  if (loading || redirectSettling || !user) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden touch-pan-y select-none"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="translate-y-[-8px]">
        <div className="mx-auto grid min-h-16 max-w-4xl grid-cols-5 items-center px-2 py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon, isActive, color, bg }) => {
            const active = isActive(path);

            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className="flex w-full min-w-0 items-center justify-center transition-opacity duration-100 active:opacity-80"
              >
                <div
                  className={cn(
                    "flex w-full min-w-0 max-w-full flex-col items-center justify-center rounded-2xl px-4 py-2 font-medium transition-colors duration-150",
                    active
                      ? cn(bg, color, "shadow-sm")
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="mt-1 text-center text-[11px] leading-none">
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
