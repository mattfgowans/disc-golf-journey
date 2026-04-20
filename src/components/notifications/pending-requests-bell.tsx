"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase-auth";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export function PendingRequestsBell({ className }: { className?: string }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const ref = collection(db, "users", user.uid, "friendRequestsIn");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const has = count > 0;

  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <Bell
        className={cn(
          "h-5 w-5 transition-colors",
          has ? "text-red-500" : "text-muted-foreground"
        )}
      />

      {has && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </span>
  );
}
