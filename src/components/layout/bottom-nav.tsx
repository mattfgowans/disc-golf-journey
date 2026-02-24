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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, isActive: (p: string) => p === "/" || p.startsWith("/dashboard") },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, isActive: (p: string) => p.startsWith("/leaderboard") },
  { href: "/friends", label: "Friends", icon: Users, isActive: (p: string) => p.startsWith("/friends") },
  { href: "/patches", label: "Patches", icon: BadgeCheck, isActive: (p: string) => p.startsWith("/patches") },
  { href: "/profile", label: "Profile", icon: User, isActive: (p: string) => p.startsWith("/profile") },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { user, loading, redirectSettling } = useAuth();
  const path = normalizePath(pathname);

  if (loading || redirectSettling || !user) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-around px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, isActive }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
              isActive(path) ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
