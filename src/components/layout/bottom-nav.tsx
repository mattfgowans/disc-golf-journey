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
    color: "text-emerald-600 bg-emerald-500/8",
    isActive: (p: string) => p === "/" || p.startsWith("/dashboard"),
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    color: "text-amber-600 bg-amber-500/8",
    isActive: (p: string) => p.startsWith("/leaderboard"),
  },
  {
    href: "/friends",
    label: "Friends",
    icon: Users,
    color: "text-blue-600 bg-blue-500/8",
    isActive: (p: string) => p.startsWith("/friends"),
  },
  {
    href: "/patches",
    label: "Patches",
    icon: BadgeCheck,
    color: "text-orange-600 bg-orange-500/8",
    isActive: (p: string) => p.startsWith("/patches"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    color: "text-violet-600 bg-violet-500/8",
    isActive: (p: string) => p.startsWith("/profile"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { user, loading, redirectSettling } = useAuth();
  const path = normalizePath(pathname);

  if (loading || redirectSettling || !user) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden touch-pan-y select-none">
      <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-around px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, color, isActive }) => {
          const active = isActive(path);

          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                active
                  ? cn("rounded-xl px-2 py-1.5 font-medium shadow-sm", color)
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "scale-[1.05]")} />
            <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
