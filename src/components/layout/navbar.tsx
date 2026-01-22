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
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";

export function Navbar() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
  };

  // Determine active states for dropdown menu items
  const isDashboardActive = pathname === "/" || pathname.startsWith("/dashboard");
  const isProfileActive = pathname === "/profile";
  const isLeaderboardActive = pathname === "/leaderboard" || pathname === "/leaderboard/all";
  const isFriendsActive = pathname === "/friends";

  // Classes for active dropdown items that persist through highlighting
  const activeItemClasses =
    "text-muted-foreground hover:text-muted-foreground hover:bg-transparent data-[highlighted]:text-muted-foreground data-[highlighted]:bg-transparent";

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center px-4 container mx-auto bg-background min-h-16 py-2 sm:h-16 sm:py-0">
          <Link href="/" className="font-bold text-xl leading-tight">
            Disc Golf Journey
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-background border-b">
      <div className="flex items-center px-4 container mx-auto bg-background min-h-16 py-2 sm:h-16 sm:py-0">
        <Link href="/" className="font-bold text-xl leading-tight">
          Disc Golf Journey
        </Link>
        
        <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink-0">
          {!user ? (
            <>
              <Button variant="ghost" onClick={signInWithGoogle}>
                Sign in with Google
              </Button>
            </>
          ) : (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="ghost">
                  <Trophy className="h-4 w-4 mr-2" />
                  Leaderboard
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar>
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
