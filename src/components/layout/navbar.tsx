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
import { useAuth } from "@/lib/firebase-auth";

export function Navbar() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

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
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="ghost">🏆 Leaderboard</Button>
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
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/leaderboard">🏆 Leaderboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/friends">👥 Friends</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={handleSignOut}
                  >
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
