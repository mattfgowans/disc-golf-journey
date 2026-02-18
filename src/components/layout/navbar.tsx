"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LayoutDashboard, Trophy, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import { PendingRequestsBell } from "@/components/notifications/pending-requests-bell";

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignIn = () => {
    console.error("LOGIN: routing to /auth/callback?start=1");
    router.push("/auth/callback?start=1");
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Determine active states for dropdown menu items
  const isDashboardActive = pathname === "/" || pathname.startsWith("/dashboard");
  const isProfileActive = pathname === "/profile";
  const isLeaderboardActive = pathname.startsWith("/leaderboard");
  const isFriendsActive = pathname === "/friends";

  // Classes for active dropdown items that persist through highlighting
  const activeItemClasses =
    "text-muted-foreground hover:text-muted-foreground hover:bg-transparent data-[highlighted]:text-muted-foreground data-[highlighted]:bg-transparent";

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center px-4 container mx-auto bg-background min-h-16 py-2 sm:h-16 sm:py-0">
          <Link href="/" className="font-bold text-xl leading-tight whitespace-nowrap">
            Disc Golf Journey
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-background border-b">
      <div className="flex items-center px-4 container mx-auto bg-background min-h-16 py-2 sm:h-16 sm:py-0 min-w-0">
        <Link href="/" className="font-bold text-xl leading-tight whitespace-nowrap min-w-0 shrink-0 truncate">
          Disc Golf Journey
        </Link>
        {user ? (
          <div className="flex flex-1 items-center justify-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
            <Link href="/dashboard" aria-current={isDashboardActive ? "page" : undefined}>
              <Button
                variant="ghost"
                className={cn(
                  "flex w-16 flex-col items-center justify-center sm:w-auto sm:flex-row text-muted-foreground transition-colors hover:bg-transparent",
                  isDashboardActive ? "text-blue-600 font-medium" : "hover:text-blue-600"
                )}
              >
                <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden text-[10px] leading-none mt-1">Dashboard</span>
              </Button>
            </Link>
            <Link href="/leaderboard" aria-current={isLeaderboardActive ? "page" : undefined}>
              <Button
                variant="ghost"
                className={cn(
                  "group flex w-16 flex-col items-center justify-center sm:w-auto sm:flex-row transition-colors hover:bg-transparent",
                  isLeaderboardActive && "font-medium"
                )}
              >
                <Trophy
                  className={cn(
                    "h-4 w-4 sm:mr-2",
                    isLeaderboardActive ? "text-amber-600" : "text-amber-500 group-hover:text-amber-600"
                  )}
                />
                <span
                  className={cn(
                    "hidden sm:inline",
                    isLeaderboardActive ? "text-amber-600" : "text-muted-foreground"
                  )}
                >
                  Leaderboard
                </span>
                <span
                  className={cn(
                    "sm:hidden text-[10px] leading-none mt-1",
                    isLeaderboardActive ? "text-amber-600" : "text-muted-foreground"
                  )}
                >
                  Leaderboard
                </span>
              </Button>
            </Link>
          </div>
        ) : null}
        <div className="flex items-center gap-2 shrink-0">
          {!user ? (
            <Button variant="ghost" onClick={handleSignIn}>
              Sign in with Google
            </Button>
          ) : (
            <>
              <Link
                href="/notifications"
                className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-transparent"
                aria-label="Notifications"
              >
                <PendingRequestsBell />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="shrink-0">
                  <Avatar className="shrink-0">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0).toUpperCase() || "DG"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    {user.displayName || user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className={isProfileActive ? activeItemClasses : ""}>
                    <Link href="/profile" className="flex items-center">
                      <User className={`h-4 w-4 mr-2 ${isProfileActive ? "text-muted-foreground" : ""}`} />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className={isLeaderboardActive ? activeItemClasses : ""}>
                    <Link href="/leaderboard" className="flex items-center">
                      <Trophy className={`h-4 w-4 mr-2 ${isLeaderboardActive ? "text-muted-foreground" : ""}`} />
                      Leaderboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className={isFriendsActive ? activeItemClasses : ""}>
                    <Link href="/friends" className="flex items-center">
                      <Users className={`h-4 w-4 mr-2 ${isFriendsActive ? "text-muted-foreground" : ""}`} />
                      Friends
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
