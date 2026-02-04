"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIncomingFriendRequestsCount } from "@/lib/use-incoming-requests-count";

export function PendingRequestsBell({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const { count } = useIncomingFriendRequestsCount(currentUserId);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-10 w-10"
      onClick={() => router.push("/notifications")}
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] leading-none"
        >
          {count}
        </Badge>
      )}
    </Button>
  );
}

